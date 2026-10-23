// The bundle manifest is a composition layer only: `dsh.bundle.patch` points at
// cordis.patch.yml, which mounts the real provider from ./provider. Exporting
// nothing here keeps the package safe to import for its metadata alone.
export {};
