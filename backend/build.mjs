import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  platform: "node",
  format: "esm",
  target: "es2022",
  outExtension: { ".js": ".mjs" },
  external: [
    "sharp", "pg-native", "canvas", "jsdom",
    "@parcel/watcher", "fsevents",
  ],
  packages: "external",
  sourcemap: true,
  logLevel: "info",
});
