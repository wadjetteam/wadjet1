-- ============================================================
-- ROLE-BASED DYNAMIC REPORTING ENGINE — Database Schema
-- ============================================================

-- -------------------------------------------------------
-- 1. Component type registry (data source + render type)
-- -------------------------------------------------------
CREATE TABLE component_types (
  type_code       VARCHAR(64)  PRIMARY KEY,          -- e.g. 'risk_heatmap', 'compliance_gauge'
  display_name    VARCHAR(128) NOT NULL,
  renderer        VARCHAR(64)  NOT NULL,             -- frontend component key (e.g. 'RiskHeatmap')
  default_width   INTEGER      NOT NULL DEFAULT 6,   -- grid columns (1-12)
  default_height  INTEGER      NOT NULL DEFAULT 4,   -- grid rows
  is_multi_row    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
-- 2. Dashboard component library
-- -------------------------------------------------------
CREATE TABLE dashboard_components (
  component_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code       VARCHAR(64)  NOT NULL REFERENCES component_types(type_code),
  code            VARCHAR(128) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  config          JSONB        NOT NULL DEFAULT '{}',  -- renderer props, default filters, sort
  -- The query template with parameterised placeholders
  query_dialect   VARCHAR(16)  NOT NULL DEFAULT 'sql'
                    CHECK (query_dialect IN ('sql', 'neo4j')),
  query_template  TEXT         NOT NULL,              -- e.g. 'SELECT * FROM risks WHERE status = :status'
  query_params    JSONB        NOT NULL DEFAULT '[]',  -- ordered param metadata [{name, type, default}]

  -- Each component has exactly ONE data pool it reads from
  data_domain     VARCHAR(64)  NOT NULL,              -- 'risk', 'compliance', 'evidence', 'framework'
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_dc_type   ON dashboard_components (type_code);
CREATE INDEX idx_dc_domain ON dashboard_components (data_domain);

-- -------------------------------------------------------
-- 3. Role definitions
-- -------------------------------------------------------
CREATE TABLE grc_roles (
  role_code       VARCHAR(64)  PRIMARY KEY,          -- 'EXECUTIVE', 'CRO', 'RISK_OFFICER', 'IT_AUDITOR', 'COMPLIANCE_MGR'
  display_name    VARCHAR(128) NOT NULL,
  priority        INTEGER      NOT NULL DEFAULT 0,    -- higher = more data access
  description     TEXT,
  is_system       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
-- 4. Role → Component permission matrix
-- -------------------------------------------------------
CREATE TABLE role_component_permissions (
  role_code       VARCHAR(64)  NOT NULL REFERENCES grc_roles(role_code) ON DELETE CASCADE,
  component_id    UUID         NOT NULL REFERENCES dashboard_components(component_id) ON DELETE CASCADE,
  visible         BOOLEAN      NOT NULL DEFAULT TRUE, -- can this role even see the component?
  data_scope      VARCHAR(64)  NOT NULL DEFAULT 'OWN_DEPT'
                    CHECK (data_scope IN (
                      'OWN_DEPT',     -- only rows matching user's department
                      'OWN_RECORDS',  -- only records where user is owner/assignee
                      'ALL_DEPT',     -- all data in user's department hierarchy
                      'ALL_READ',     -- full read access
                      'AGGREGATE_ONLY'-- aggregated totals, no raw rows
                    )),
  max_rows         INTEGER,                           -- NULL = unlimited
  allow_export     BOOLEAN      NOT NULL DEFAULT FALSE,
  override_filter  TEXT,                              -- optional raw SQL/WHERE clause appended to every query
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

  PRIMARY KEY (role_code, component_id)
);

CREATE INDEX idx_rcp_component ON role_component_permissions (component_id);

-- -------------------------------------------------------
-- 5. Dashboard layout templates (role-specific defaults)
-- -------------------------------------------------------
CREATE TABLE dashboard_templates (
  template_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_code       VARCHAR(64)  NOT NULL REFERENCES grc_roles(role_code) ON DELETE CASCADE,
  name            VARCHAR(128) NOT NULL,
  is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
  layout_config   JSONB        NOT NULL,              -- grid layout: [{componentId, x, y, w, h}]
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

  UNIQUE (role_code, name)
);

CREATE INDEX idx_dt_role ON dashboard_templates (role_code);

-- -------------------------------------------------------
-- 6. Per-user dashboard overrides
-- -------------------------------------------------------
CREATE TABLE user_dashboards (
  user_id         UUID        NOT NULL,
  template_id     UUID        NOT NULL REFERENCES dashboard_templates(template_id) ON DELETE CASCADE,
  layout_config   JSONB,                              -- user-specific override of grid positions
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, template_id)
);

-- -------------------------------------------------------
-- 7. Component viewership audit  (who saw what, when)
-- -------------------------------------------------------
CREATE TABLE component_access_log (
  log_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL,
  role_code       VARCHAR(64)  NOT NULL,
  component_id    UUID         NOT NULL,
  rows_returned   INTEGER      NOT NULL DEFAULT 0,
  query_duration_ms INTEGER,
  accessed_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_cal_user ON component_access_log (user_id, accessed_at DESC);
