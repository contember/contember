import prom, { Registry } from 'prom-client'

const LABEL_PROJECT = 'contember_project'
type Label = typeof LABEL_PROJECT

/**
 * Prometheus metrics for the Actions dispatch subsystem.
 *
 * Two audiences, deliberately kept as cheap in-memory counters/gauges (no table polling):
 *  - system / operator — is the dispatch loop alive and flowing, or stuck?
 *      `workerHeartbeat` (liveness; works even when the queue is empty) + `workerCrashed`.
 *  - userland — are webhook deliveries failing?
 *      `eventsSucceeded` / `deliveryAttemptsFailed` / `eventsFailed`.
 *
 * Counting units matter: a *delivery attempt* and an *event* are different. A success is always
 * terminal (one event = one successful attempt), but a failure splits — a failed attempt may be
 * retried many times, while a terminally failed event gives up once. Hence the asymmetric set:
 * one success counter, but both a per-attempt failure counter and a terminal-event failure counter.
 *
 * Queue backlog is *estimated* as a trend from the counters:
 *   enqueued − succeeded − failed   (compare rates; the absolute value drifts across restarts and
 *   ignores manual retry/stop, so for an exact depth query the `actions_event` table instead).
 *
 * Labelled only by `contember_project` to keep cardinality bounded; per-target / per-trigger
 * detail belongs in the table-backed userland view, not in Prometheus.
 */
export class ActionsMetrics {
	/** Events written to the queue (inflow). Unit: event. */
	public readonly eventsEnqueued: prom.Counter<Label>
	/** Events delivered successfully (terminal). Unit: event (= successful attempt). */
	public readonly eventsSucceeded: prom.Counter<Label>
	/** Failed webhook delivery attempts, including ones that will be retried. Unit: attempt. */
	public readonly deliveryAttemptsFailed: prom.Counter<Label>
	/** Events that reached a terminal failed state (retries exhausted or unknown target). Unit: event. */
	public readonly eventsFailed: prom.Counter<Label>
	/** Unix timestamp (seconds) of the last dispatch-loop iteration; staleness ⇒ stuck/dead worker. */
	public readonly workerHeartbeat: prom.Gauge<Label>
	/** Dispatch-loop crashes (each is auto-restarted by the supervisor). */
	public readonly workerCrashed: prom.Counter<Label>

	constructor(registry: Registry) {
		const labelNames: Label[] = [LABEL_PROJECT]
		this.eventsEnqueued = new prom.Counter({
			registers: [registry],
			name: 'contember_actions_events_enqueued_total',
			help: 'Total number of action events written to the queue (inflow), by contember_project.',
			labelNames,
		})
		this.eventsSucceeded = new prom.Counter({
			registers: [registry],
			name: 'contember_actions_events_succeeded_total',
			help: 'Total number of action events delivered successfully, by contember_project.',
			labelNames,
		})
		this.deliveryAttemptsFailed = new prom.Counter({
			registers: [registry],
			name: 'contember_actions_delivery_attempts_failed_total',
			help: 'Total number of failed webhook delivery attempts (including attempts that will be retried), by contember_project.',
			labelNames,
		})
		this.eventsFailed = new prom.Counter({
			registers: [registry],
			name: 'contember_actions_events_failed_total',
			help: 'Total number of action events that reached a terminal failed state (retries exhausted or unknown target), by contember_project.',
			labelNames,
		})
		this.workerHeartbeat = new prom.Gauge({
			registers: [registry],
			name: 'contember_actions_worker_heartbeat_timestamp_seconds',
			help: 'Unix timestamp of the last dispatch-loop iteration per contember_project; staleness indicates a stuck or dead worker.',
			labelNames,
		})
		this.workerCrashed = new prom.Counter({
			registers: [registry],
			name: 'contember_actions_worker_crashed_total',
			help: 'Total number of dispatch-loop crashes per contember_project (each is auto-restarted by the supervisor).',
			labelNames,
		})
	}

	public forProject(projectSlug: string): ProjectActionsMetrics {
		return new ProjectActionsMetrics(this, projectSlug)
	}
}

/**
 * A view of {@link ActionsMetrics} bound to a single project, so call sites don't repeat the label.
 */
export class ProjectActionsMetrics {
	private readonly labels: { [LABEL_PROJECT]: string }

	constructor(
		private readonly metrics: ActionsMetrics,
		private readonly projectSlug: string,
	) {
		this.labels = { [LABEL_PROJECT]: projectSlug }
	}

	public enqueued(count: number): void {
		if (count > 0) {
			this.metrics.eventsEnqueued.inc(this.labels, count)
		}
	}

	public succeeded(count: number): void {
		if (count > 0) {
			this.metrics.eventsSucceeded.inc(this.labels, count)
		}
	}

	public deliveryAttemptFailed(count: number): void {
		if (count > 0) {
			this.metrics.deliveryAttemptsFailed.inc(this.labels, count)
		}
	}

	public failed(count: number): void {
		if (count > 0) {
			this.metrics.eventsFailed.inc(this.labels, count)
		}
	}

	public heartbeat(): void {
		this.metrics.workerHeartbeat.set(this.labels, Date.now() / 1000)
	}

	public crashed(): void {
		this.metrics.workerCrashed.inc(this.labels, 1)
	}

	/** Drop the per-project heartbeat series when the worker stops, so a removed project doesn't look stuck. */
	public dispose(): void {
		this.metrics.workerHeartbeat.remove(this.projectSlug)
	}
}
