import prom, { Registry } from 'prom-client'

const LABEL_PROJECT = 'contember_project'
const LABEL_JOB = 'job'
type ProjectLabel = typeof LABEL_PROJECT
type JobLabel = typeof LABEL_PROJECT | typeof LABEL_JOB

/**
 * Prometheus metrics for the scheduler, kept as cheap in-memory counters/gauges (no table polling)
 * and registered onto the engine's shared registry via the plugin's master-container hook.
 *
 * Two audiences:
 *  - operator — is a per-project scheduler loop alive? `workerHeartbeat` (liveness, refreshed each
 *    tick even when idle) + `workerCrashed`.
 *  - userland — are the jobs running and succeeding? `jobRuns` / `jobFailures` / `jobDuration` /
 *    `jobLastRun`, labelled by `job`.
 *
 * Job metrics are labelled by `contember_project` + `job`; worker liveness metrics by project only.
 */
export class SchedulerMetrics {
	/** Job invocations that were due and executed (success or failure). Unit: run. */
	public readonly jobRuns: prom.Counter<JobLabel>
	/** Job invocations whose `run` threw. Unit: run. */
	public readonly jobFailures: prom.Counter<JobLabel>
	/** Wall-clock duration of each job run, in seconds. */
	public readonly jobDuration: prom.Histogram<JobLabel>
	/** Unix timestamp (seconds) of the last time each job ran. */
	public readonly jobLastRun: prom.Gauge<JobLabel>
	/** Unix timestamp (seconds) of the last scheduler-loop iteration; staleness ⇒ stuck/dead loop. */
	public readonly workerHeartbeat: prom.Gauge<ProjectLabel>
	/** Scheduler-loop crashes per project (each auto-restarted by the supervisor). */
	public readonly workerCrashed: prom.Counter<ProjectLabel>

	constructor(registry: Registry) {
		const jobLabels: JobLabel[] = [LABEL_PROJECT, LABEL_JOB]
		const projectLabels: ProjectLabel[] = [LABEL_PROJECT]
		this.jobRuns = new prom.Counter({
			registers: [registry],
			name: 'contember_scheduler_job_runs_total',
			help: 'Total number of scheduled job runs (due invocations, success or failure), by contember_project and job.',
			labelNames: jobLabels,
		})
		this.jobFailures = new prom.Counter({
			registers: [registry],
			name: 'contember_scheduler_job_failures_total',
			help: 'Total number of scheduled job runs that threw, by contember_project and job.',
			labelNames: jobLabels,
		})
		this.jobDuration = new prom.Histogram({
			registers: [registry],
			name: 'contember_scheduler_job_duration_seconds',
			help: 'Duration of scheduled job runs in seconds, by contember_project and job.',
			labelNames: jobLabels,
			buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 15, 60, 300],
		})
		this.jobLastRun = new prom.Gauge({
			registers: [registry],
			name: 'contember_scheduler_job_last_run_timestamp_seconds',
			help: 'Unix timestamp of the last run of each scheduled job, by contember_project and job.',
			labelNames: jobLabels,
		})
		this.workerHeartbeat = new prom.Gauge({
			registers: [registry],
			name: 'contember_scheduler_worker_heartbeat_timestamp_seconds',
			help: 'Unix timestamp of the last scheduler-loop iteration per contember_project; staleness indicates a stuck or dead loop.',
			labelNames: projectLabels,
		})
		this.workerCrashed = new prom.Counter({
			registers: [registry],
			name: 'contember_scheduler_worker_crashed_total',
			help: 'Total number of scheduler-loop crashes per contember_project (each is auto-restarted by the supervisor).',
			labelNames: projectLabels,
		})
	}

	public forProject(projectSlug: string): ProjectSchedulerMetrics {
		return new ProjectSchedulerMetrics(this, projectSlug)
	}
}

/** A view of {@link SchedulerMetrics} bound to a single project, so call sites don't repeat labels. */
export class ProjectSchedulerMetrics {
	private readonly projectLabels: { [LABEL_PROJECT]: string }

	constructor(
		private readonly metrics: SchedulerMetrics,
		private readonly projectSlug: string,
	) {
		this.projectLabels = { [LABEL_PROJECT]: projectSlug }
	}

	private jobLabels(job: string): { [LABEL_PROJECT]: string; [LABEL_JOB]: string } {
		return { [LABEL_PROJECT]: this.projectSlug, [LABEL_JOB]: job }
	}

	/** Record a completed job run (success or failure) with its duration in seconds. */
	public jobRun(job: string, durationSeconds: number): void {
		const labels = this.jobLabels(job)
		this.metrics.jobRuns.inc(labels, 1)
		this.metrics.jobDuration.observe(labels, durationSeconds)
		this.metrics.jobLastRun.set(labels, Date.now() / 1000)
	}

	public jobFailed(job: string): void {
		this.metrics.jobFailures.inc(this.jobLabels(job), 1)
	}

	public heartbeat(): void {
		this.metrics.workerHeartbeat.set(this.projectLabels, Date.now() / 1000)
	}

	public crashed(): void {
		this.metrics.workerCrashed.inc(this.projectLabels, 1)
	}

	/** Drop the per-project heartbeat series when the loop stops, so a removed project doesn't look stuck. */
	public dispose(): void {
		this.metrics.workerHeartbeat.remove(this.projectSlug)
	}
}
