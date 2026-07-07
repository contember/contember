import prom, { Registry } from 'prom-client'

const LABEL_PROJECT = 'contember_project'
const LABEL_ENTITY = 'entity'
const LABEL_POLICY = 'policy'

type DeletedLabel = typeof LABEL_PROJECT | typeof LABEL_ENTITY | typeof LABEL_POLICY
type RunLabel = typeof LABEL_PROJECT | typeof LABEL_POLICY

/**
 * Prometheus metrics for the retention job, kept as cheap in-memory counters/histograms and registered
 * onto the engine's shared registry via the plugin's master-container hook (mirrors `SchedulerMetrics`
 * / `ActionsMetrics`). Answers: how many rows is retention pruning, and are policy runs failing?
 */
export class RetentionMetrics {
	/** Rows deleted by retention, by project / entity / policy. */
	public readonly deleted: prom.Counter<DeletedLabel>
	/** Wall-clock duration of a single policy-per-stage run, in seconds. */
	public readonly runDuration: prom.Histogram<RunLabel>
	/** Policy-per-stage runs that threw, by project / policy. */
	public readonly runErrors: prom.Counter<RunLabel>

	constructor(registry: Registry) {
		const deletedLabels: DeletedLabel[] = [LABEL_PROJECT, LABEL_ENTITY, LABEL_POLICY]
		const runLabels: RunLabel[] = [LABEL_PROJECT, LABEL_POLICY]
		this.deleted = new prom.Counter({
			registers: [registry],
			name: 'contember_retention_deleted_total',
			help: 'Total number of rows deleted by retention policies, by contember_project, entity and policy.',
			labelNames: deletedLabels,
		})
		this.runDuration = new prom.Histogram({
			registers: [registry],
			name: 'contember_retention_run_duration_seconds',
			help: 'Duration of a single retention policy run (per stage) in seconds, by contember_project and policy.',
			labelNames: runLabels,
			buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 15, 60, 300],
		})
		this.runErrors = new prom.Counter({
			registers: [registry],
			name: 'contember_retention_run_errors_total',
			help: 'Total number of retention policy runs (per stage) that threw, by contember_project and policy.',
			labelNames: runLabels,
		})
	}

	public forProject(projectSlug: string): ProjectRetentionMetrics {
		return new ProjectRetentionMetrics(this, projectSlug)
	}
}

/** A view of {@link RetentionMetrics} bound to a single project, so call sites don't repeat the label. */
export class ProjectRetentionMetrics {
	constructor(
		private readonly metrics: RetentionMetrics,
		private readonly projectSlug: string,
	) {
	}

	/** Record `count` rows deleted for a policy on an entity. */
	public recordDeleted(entity: string, policy: string, count: number): void {
		if (count > 0) {
			this.metrics.deleted.inc({ [LABEL_PROJECT]: this.projectSlug, [LABEL_ENTITY]: entity, [LABEL_POLICY]: policy }, count)
		}
	}

	/** Record a completed policy-per-stage run with its duration in seconds. */
	public recordRun(policy: string, durationSeconds: number): void {
		this.metrics.runDuration.observe({ [LABEL_PROJECT]: this.projectSlug, [LABEL_POLICY]: policy }, durationSeconds)
	}

	public recordError(policy: string): void {
		this.metrics.runErrors.inc({ [LABEL_PROJECT]: this.projectSlug, [LABEL_POLICY]: policy }, 1)
	}
}
