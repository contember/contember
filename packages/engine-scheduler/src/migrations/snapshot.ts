// Bootstrap snapshot for a fresh database. With a single migration the collapsed schema is identical
// to that migration, so it is delegated to keep the two in sync. Add explicit SQL here only if later
// migrations make the snapshot diverge from replaying them one by one.
import migration from './2026-07-07-120000-scheduler-run.js'

export default migration
