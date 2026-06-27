-- ============================================================================
-- WAJET GRC PLATFORM — Banking-Grade KPI & KRI Management Schema
-- Target  : PostgreSQL 15+ / SQL Server 2022+
-- Author  : Senior Database Architect — Wajet GRC
-- Purpose : Core schema for KPI/KRI catalog, periodic measurements,
--           breach remediation tasks, and metric-risk mappings.
-- ============================================================================

-- 0. EXTENSIONS (PostgreSQL only — comment out for SQL Server)
-- ============================================================================
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUM TYPES (PostgreSQL) — SQL Server: use CHECK constraints instead
-- ============================================================================
-- DROP TYPE IF EXISTS measurement_status CASCADE;
-- DROP TYPE IF EXISTS appetite_status CASCADE;
-- DROP TYPE IF EXISTS calculation_type CASCADE;
-- DROP TYPE IF EXISTS escalation_level CASCADE;

-- CREATE TYPE measurement_status AS ENUM ('Draft','Pending Review','Approved');
-- CREATE TYPE appetite_status    AS ENUM ('Green','Amber','Red');
-- CREATE TYPE calculation_type   AS ENUM ('Manual','Calculated','Integrated');
-- CREATE TYPE escalation_level   AS ENUM ('Level0_Owner','Level1_DeptHead','Level2_CRO_CEO');

-- ============================================================================
-- 2. KPI CATALOG — Unique KPI Definitions
-- ============================================================================
-- Stores master definitions of Key Performance Indicators aligned to
-- CBE regulatory requirements and internal banking objectives.
CREATE TABLE kpi_catalog (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    code                VARCHAR(50)     NOT NULL UNIQUE,
    name                VARCHAR(255)    NOT NULL,
    description         TEXT,
    category            VARCHAR(100)    NOT NULL,
    business_unit       VARCHAR(100)    NOT NULL,
    department          VARCHAR(100)    NOT NULL,
    owner_id            VARCHAR(36)     NOT NULL,
    reviewer_id         VARCHAR(36),
    frequency           VARCHAR(20)     NOT NULL DEFAULT 'Monthly'
                        CHECK (frequency IN ('Daily','Weekly','Monthly','Quarterly','Annually')),
    calculation_type    VARCHAR(20)     NOT NULL DEFAULT 'Manual'
                        CHECK (calculation_type IN ('Manual','Calculated','Integrated')),
    calculation_formula TEXT,
    api_endpoint        VARCHAR(500),
    api_json_key        VARCHAR(255),
    target_value        DECIMAL(18,4)   NOT NULL DEFAULT 0,
    warning_threshold   DECIMAL(18,4),
    critical_threshold  DECIMAL(18,4),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    version             INTEGER         NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  kpi_catalog IS 'Master definitions of Key Performance Indicators for CBE regulatory compliance.';
COMMENT ON COLUMN kpi_catalog.calculation_type IS 'Manual=user entry, Calculated=formula-based, Integrated=external API pull';
COMMENT ON COLUMN kpi_catalog.api_endpoint     IS 'HTTPS endpoint for Integrated KPIs — must use TLS 1.2+';
COMMENT ON COLUMN kpi_catalog.api_json_key     IS 'JSONPath/dot-notation key to extract value from API response';

CREATE INDEX idx_kpi_catalog_category       ON kpi_catalog(category);
CREATE INDEX idx_kpi_catalog_owner          ON kpi_catalog(owner_id);
CREATE INDEX idx_kpi_catalog_frequency      ON kpi_catalog(frequency);
CREATE INDEX idx_kpi_catalog_calc_type      ON kpi_catalog(calculation_type);
CREATE INDEX idx_kpi_catalog_active         ON kpi_catalog(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 3. KRI CATALOG — Risk Indicators linked to Risk Register
-- ============================================================================
-- Captures Key Risk Indicators mapped to the enterprise risk register
-- and CBE-defined risk appetite boundaries.
CREATE TABLE kri_catalog (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    code                VARCHAR(50)     NOT NULL UNIQUE,
    name                VARCHAR(255)    NOT NULL,
    risk_category       VARCHAR(100)    NOT NULL,
    linked_risk_id      VARCHAR(36),
    risk_owner_id       VARCHAR(36)     NOT NULL,
    frequency           VARCHAR(20)     NOT NULL DEFAULT 'Monthly'
                        CHECK (frequency IN ('Daily','Weekly','Monthly','Quarterly','Annually')),
    green_min           DECIMAL(18,4),
    green_max           DECIMAL(18,4),
    amber_min           DECIMAL(18,4),
    amber_max           DECIMAL(18,4),
    red_min             DECIMAL(18,4),
    red_max             DECIMAL(18,4),
    is_integrated       BOOLEAN         NOT NULL DEFAULT FALSE,
    api_endpoint        VARCHAR(500),
    api_json_key        VARCHAR(255),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  kri_catalog IS 'Key Risk Indicators mapped to risk register and CBE risk appetite thresholds.';
COMMENT ON COLUMN kri_catalog.linked_risk_id IS 'FK to risk register — references risk.riskId or similar identifier';
COMMENT ON COLUMN kri_catalog.green_min      IS 'Lower bound of Green (Within Appetite) range';
COMMENT ON COLUMN kri_catalog.green_max      IS 'Upper bound of Green (Within Appetite) range';
COMMENT ON COLUMN kri_catalog.red_min        IS 'Lower bound of Red (Outside Risk Appetite) range';
COMMENT ON COLUMN kri_catalog.red_max        IS 'Upper bound of Red (Outside Risk Appetite) range';

CREATE INDEX idx_kri_catalog_category       ON kri_catalog(risk_category);
CREATE INDEX idx_kri_catalog_risk_link      ON kri_catalog(linked_risk_id);
CREATE INDEX idx_kri_catalog_owner          ON kri_catalog(risk_owner_id);
CREATE INDEX idx_kri_catalog_frequency      ON kri_catalog(frequency);
CREATE INDEX idx_kri_catalog_active         ON kri_catalog(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 4. KPI MEASUREMENTS — Periodic KPI Values
-- ============================================================================
-- Captures the actual periodic measurement for each KPI.
-- One row per KPI per period (YYYY-MM).
CREATE TABLE kpi_measurements (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    catalog_id          VARCHAR(36)     NOT NULL REFERENCES kpi_catalog(id)
                        ON DELETE CASCADE,
    period              VARCHAR(7)      NOT NULL,
    current_value       DECIMAL(18,4),
    status              VARCHAR(20)     NOT NULL DEFAULT 'Draft'
                        CHECK (status IN ('Draft','Pending Review','Approved')),
    appetite_status     VARCHAR(10)
                        CHECK (appetite_status IN ('Green','Amber','Red')),
    evidence_file_path  VARCHAR(500),
    comments            TEXT,
    submitted_by        VARCHAR(36),
    approved_by         VARCHAR(36),
    approved_at         TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_kpi_measurement_period UNIQUE (catalog_id, period)
);

COMMENT ON TABLE  kpi_measurements IS 'Periodic (monthly) KPI measurements with status workflow and evidence.';
COMMENT ON COLUMN kpi_measurements.period         IS 'YYYY-MM format representing the measurement period';
COMMENT ON COLUMN kpi_measurements.appetite_status IS 'Derived by comparing current_value against warning/critical thresholds';

CREATE INDEX idx_kpi_meas_catalog  ON kpi_measurements(catalog_id);
CREATE INDEX idx_kpi_meas_period   ON kpi_measurements(period);
CREATE INDEX idx_kpi_meas_status   ON kpi_measurements(status);
CREATE INDEX idx_kpi_meas_appetite ON kpi_measurements(appetite_status);
CREATE INDEX idx_kpi_meas_submitted ON kpi_measurements(submitted_by);

-- ============================================================================
-- 5. KRI MEASUREMENTS — Periodic KRI Values
-- ============================================================================
-- Captures the actual periodic measurement for each KRI.
-- appetite_status is auto-derived from green/amber/red range boundaries.
CREATE TABLE kri_measurements (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    catalog_id          VARCHAR(36)     NOT NULL REFERENCES kri_catalog(id)
                        ON DELETE CASCADE,
    period              VARCHAR(7)      NOT NULL,
    current_value       DECIMAL(18,4),
    status              VARCHAR(20)     NOT NULL DEFAULT 'Draft'
                        CHECK (status IN ('Draft','Pending Review','Approved')),
    appetite_status     VARCHAR(10)
                        CHECK (appetite_status IN ('Green','Amber','Red')),
    evidence_file_path  VARCHAR(500),
    comments            TEXT,
    submitted_by        VARCHAR(36),
    approved_by         VARCHAR(36),
    approved_at         TIMESTAMP,
    previous_value      DECIMAL(18,4),
    percentage_change   DECIMAL(10,2),
    trend_direction     VARCHAR(10)
                        CHECK (trend_direction IN ('Increasing','Stable','Decreasing')),
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_kri_measurement_period UNIQUE (catalog_id, period)
);

COMMENT ON TABLE  kri_measurements IS 'Periodic KRI measurements with trend calculation and appetite classification.';
COMMENT ON COLUMN kri_measurements.previous_value      IS 'Previous month value for trend computation';
COMMENT ON COLUMN kri_measurements.percentage_change   IS 'Month-over-month percentage change';
COMMENT ON COLUMN kri_measurements.trend_direction     IS 'Increasing/Stable/Decreasing based on MoM comparison';

CREATE INDEX idx_kri_meas_catalog   ON kri_measurements(catalog_id);
CREATE INDEX idx_kri_meas_period    ON kri_measurements(period);
CREATE INDEX idx_kri_meas_status    ON kri_measurements(status);
CREATE INDEX idx_kri_meas_appetite  ON kri_measurements(appetite_status);
CREATE INDEX idx_kri_meas_trend     ON kri_measurements(trend_direction);
CREATE INDEX idx_kri_meas_submitted ON kri_measurements(submitted_by);

-- ============================================================================
-- 6. BREACH REMEDIATION TASKS — Escalation-Aware Remediation
-- ============================================================================
-- Created when a KRI measurement is approved with appetite_status = 'Red'.
-- Follows a 3-level escalation matrix with strict SLA windows.
CREATE TABLE breach_remediation_tasks (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    kri_measurement_id  VARCHAR(36)     NOT NULL REFERENCES kri_measurements(id)
                        ON DELETE CASCADE,
    kri_catalog_id      VARCHAR(36)     NOT NULL REFERENCES kri_catalog(id),
    risk_owner_id       VARCHAR(36)     NOT NULL,
    dept_head_id        VARCHAR(36),
    cro_id              VARCHAR(36),
    ceo_id              VARCHAR(36),
    escalation_level    VARCHAR(20)     NOT NULL DEFAULT 'Level0_Owner'
                        CHECK (escalation_level IN ('Level0_Owner','Level1_DeptHead','Level2_CRO_CEO')),
    title               VARCHAR(255)    NOT NULL,
    description         TEXT,
    severity            VARCHAR(20)     NOT NULL DEFAULT 'High'
                        CHECK (severity IN ('Low','Medium','High','Critical')),
    status              VARCHAR(20)     NOT NULL DEFAULT 'Open'
                        CHECK (status IN ('Open','In Progress','Resolved','Closed')),
    due_by              TIMESTAMP       NOT NULL,
    resolved_at         TIMESTAMP,
    root_cause_analysis TEXT,
    evidence_file_path  VARCHAR(500),
    level0_escalated_at TIMESTAMP,
    level1_escalated_at TIMESTAMP,
    level2_escalated_at TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  breach_remediation_tasks IS 'Remediation action plans triggered by KRI breaches with 3-level escalation SLA.';
COMMENT ON COLUMN breach_remediation_tasks.escalation_level IS 'Level0_Owner=initial, Level1_DeptHead=48h overdue, Level2_CRO_CEO=72h overdue';
COMMENT ON COLUMN breach_remediation_tasks.due_by           IS '48 hours from creation — hard SLA for remediation';

CREATE INDEX idx_breach_task_measurement ON breach_remediation_tasks(kri_measurement_id);
CREATE INDEX idx_breach_task_kri         ON breach_remediation_tasks(kri_catalog_id);
CREATE INDEX idx_breach_task_owner       ON breach_remediation_tasks(risk_owner_id);
CREATE INDEX idx_breach_task_escalation  ON breach_remediation_tasks(escalation_level);
CREATE INDEX idx_breach_task_status      ON breach_remediation_tasks(status);
CREATE INDEX idx_breach_task_due_by      ON breach_remediation_tasks(due_by);

-- ============================================================================
-- 7. METRIC-RISK MAPPING — Association between Risks and KPIs/KRIs
-- ============================================================================
-- Tracks which risks are linked to which metrics for the Risk-to-Metric mapper.
CREATE TABLE metric_risk_mappings (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    risk_id             VARCHAR(36)     NOT NULL,
    metric_type         VARCHAR(10)     NOT NULL CHECK (metric_type IN ('KPI','KRI')),
    metric_catalog_id   VARCHAR(36)     NOT NULL,
    mapping_type        VARCHAR(50)     DEFAULT 'Primary',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_metric_risk UNIQUE (risk_id, metric_type, metric_catalog_id)
);

COMMENT ON TABLE metric_risk_mappings IS 'Links risk register entries to their associated KPIs and KRIs.';

CREATE INDEX idx_mrm_risk   ON metric_risk_mappings(risk_id);
CREATE INDEX idx_mrm_metric ON metric_risk_mappings(metric_type, metric_catalog_id);

-- ============================================================================
-- 8. NOTIFICATION LOG — Audit trail for all sent notifications
-- ============================================================================
CREATE TABLE notification_log (
    id                  VARCHAR(36)     PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
    trigger_type        VARCHAR(50)     NOT NULL,
    recipient_type      VARCHAR(20)     NOT NULL CHECK (recipient_type IN ('Owner','Reviewer','DeptHead','CRO','CEO')),
    recipient_address   VARCHAR(255)    NOT NULL,
    channel             VARCHAR(10)     NOT NULL CHECK (channel IN ('Email','SMS')),
    subject             VARCHAR(255),
    body                TEXT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent','Failed','Pending')),
    sent_at             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_trigger    ON notification_log(trigger_type);
CREATE INDEX idx_notif_recipient  ON notification_log(recipient_type);
CREATE INDEX idx_notif_channel    ON notification_log(channel);
CREATE INDEX idx_notif_sent_at    ON notification_log(sent_at);
