import { beforeEach, describe, expect, test } from 'bun:test'
import { Registry } from 'prom-client'
import { SchedulerMetrics } from '../../../src/SchedulerMetrics.js'

// Parse the Prometheus text exposition and return the value of the first sample line whose name
// matches and which contains every provided label fragment (e.g. `job="prune"`).
const valueFor = async (registry: Registry, name: string, ...labels: string[]): Promise<number | undefined> => {
	const text = await registry.metrics()
	const line = text
		.split('\n')
		.find(it => it.startsWith(`${name}{`) && labels.every(label => it.includes(label)))
	if (!line) {
		return undefined
	}
	return Number(line.slice(line.lastIndexOf(' ') + 1))
}

describe('SchedulerMetrics', () => {
	let registry: Registry
	let metrics: SchedulerMetrics

	beforeEach(() => {
		registry = new Registry()
		metrics = new SchedulerMetrics(registry)
	})

	test('jobRun counts runs, records duration and last-run, labelled by project + job', async () => {
		metrics.forProject('blog').jobRun('prune', 0.25)
		metrics.forProject('blog').jobRun('prune', 0.75)
		metrics.forProject('shop').jobRun('prune', 1)

		expect(await valueFor(registry, 'contember_scheduler_job_runs_total', 'contember_project="blog"', 'job="prune"')).toBe(2)
		expect(await valueFor(registry, 'contember_scheduler_job_runs_total', 'contember_project="shop"', 'job="prune"')).toBe(1)
		expect(await valueFor(registry, 'contember_scheduler_job_duration_seconds_count', 'contember_project="blog"', 'job="prune"')).toBe(2)
		expect(await valueFor(registry, 'contember_scheduler_job_last_run_timestamp_seconds', 'contember_project="blog"', 'job="prune"'))
			.toBeGreaterThan(1_700_000_000)
	})

	test('jobFailed increments the failure counter', async () => {
		const project = metrics.forProject('blog')
		project.jobFailed('prune')
		project.jobFailed('prune')

		expect(await valueFor(registry, 'contember_scheduler_job_failures_total', 'contember_project="blog"', 'job="prune"')).toBe(2)
	})

	test('heartbeat sets a recent timestamp; dispose removes only the heartbeat series', async () => {
		const project = metrics.forProject('blog')
		project.jobRun('prune', 0.1)
		project.heartbeat()

		expect(await valueFor(registry, 'contember_scheduler_worker_heartbeat_timestamp_seconds', 'contember_project="blog"'))
			.toBeGreaterThan(1_700_000_000)

		project.dispose()

		expect(await valueFor(registry, 'contember_scheduler_worker_heartbeat_timestamp_seconds', 'contember_project="blog"')).toBeUndefined()
		// the run counter is untouched
		expect(await valueFor(registry, 'contember_scheduler_job_runs_total', 'contember_project="blog"', 'job="prune"')).toBe(1)
	})

	test('crash counter increments per crash', async () => {
		const project = metrics.forProject('blog')
		project.crashed()
		project.crashed()

		expect(await valueFor(registry, 'contember_scheduler_worker_crashed_total', 'contember_project="blog"')).toBe(2)
	})
})
