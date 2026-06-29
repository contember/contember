import { beforeEach, describe, expect, test } from 'bun:test'
import { Registry } from 'prom-client'
import { ActionsMetrics } from '../../../src/ActionsMetrics.js'

// Parse the Prometheus text exposition (the actual /metrics output) rather than getMetricsAsJSON,
// whose return type doesn't expose sample values.
const valueFor = async (registry: Registry, name: string, project: string): Promise<number | undefined> => {
	const text = await registry.metrics()
	const line = text
		.split('\n')
		.find(it => it.startsWith(`${name}{`) && it.includes(`contember_project="${project}"`))
	if (!line) {
		return undefined
	}
	return Number(line.slice(line.lastIndexOf(' ') + 1))
}

describe('ActionsMetrics', () => {
	let registry: Registry
	let metrics: ActionsMetrics

	beforeEach(() => {
		registry = new Registry()
		metrics = new ActionsMetrics(registry)
	})

	test('counts are labelled by project via forProject', async () => {
		metrics.forProject('blog').enqueued(3)
		metrics.forProject('shop').enqueued(5)

		expect(await valueFor(registry, 'contember_actions_events_enqueued_total', 'blog')).toBe(3)
		expect(await valueFor(registry, 'contember_actions_events_enqueued_total', 'shop')).toBe(5)
	})

	test('accumulates across calls', async () => {
		const project = metrics.forProject('blog')
		project.succeeded(2)
		project.succeeded(4)
		project.deliveryAttemptFailed(1)
		project.failed(1)

		expect(await valueFor(registry, 'contember_actions_events_succeeded_total', 'blog')).toBe(6)
		expect(await valueFor(registry, 'contember_actions_delivery_attempts_failed_total', 'blog')).toBe(1)
		expect(await valueFor(registry, 'contember_actions_events_failed_total', 'blog')).toBe(1)
	})

	test('zero counts are a no-op (no series created)', async () => {
		metrics.forProject('blog').enqueued(0)

		expect(await valueFor(registry, 'contember_actions_events_enqueued_total', 'blog')).toBeUndefined()
	})

	test('heartbeat sets a recent timestamp, dispose removes only the heartbeat series', async () => {
		const project = metrics.forProject('blog')
		project.succeeded(1)
		project.heartbeat()

		const beat = await valueFor(registry, 'contember_actions_worker_heartbeat_timestamp_seconds', 'blog')
		expect(beat).toBeGreaterThan(1_700_000_000)

		project.dispose()

		// heartbeat series gone (a removed project must not look perpetually stuck)...
		expect(await valueFor(registry, 'contember_actions_worker_heartbeat_timestamp_seconds', 'blog')).toBeUndefined()
		// ...but the counter is untouched
		expect(await valueFor(registry, 'contember_actions_events_succeeded_total', 'blog')).toBe(1)
	})

	test('crash counter increments per crash', async () => {
		const project = metrics.forProject('blog')
		project.crashed()
		project.crashed()

		expect(await valueFor(registry, 'contember_actions_worker_crashed_total', 'blog')).toBe(2)
	})
})
