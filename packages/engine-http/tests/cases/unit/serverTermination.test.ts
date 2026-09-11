import { expect, test } from 'bun:test'
import { join } from 'node:path'

const fixture = join(import.meta.dir, 'serverTermination.fixture.ts')

/** Starts the fixture, sends `signal` once it listens, and measures how long the termination jobs waited. */
const terminate = async (signal: 'SIGTERM' | 'SIGINT', sigtermDelayMs: number) => {
	const proc = Bun.spawn(['bun', '--conditions=typescript', fixture, String(sigtermDelayMs)], { stdout: 'pipe', stderr: 'inherit' })
	const reader = proc.stdout.getReader()
	const decoder = new TextDecoder()
	let output = ''
	const waitFor = async (marker: string): Promise<number> => {
		while (!output.includes(marker)) {
			const { done, value } = await reader.read()
			if (done) {
				throw new Error(`The fixture exited before printing ${marker}: ${output}`)
			}
			output += decoder.decode(value)
		}
		return performance.now()
	}
	await waitFor('READY')
	const signalledAt = performance.now()
	proc.kill(signal)
	const jobsRanAt = await waitFor('JOBS')
	return { jobsWaitedMs: jobsRanAt - signalledAt, exitCode: await proc.exited }
}

test('keeps serving for the configured delay after SIGTERM, then runs the jobs', async () => {
	const { jobsWaitedMs, exitCode } = await terminate('SIGTERM', 600)

	expect(jobsWaitedMs).toBeGreaterThanOrEqual(590)
	expect(exitCode).toBe(143)
})

test('runs the jobs at once on SIGTERM when no delay is configured', async () => {
	const { jobsWaitedMs, exitCode } = await terminate('SIGTERM', 0)

	expect(jobsWaitedMs).toBeLessThan(400)
	expect(exitCode).toBe(143)
})

// Only the orchestrator's stop signal waits: an interactive Ctrl+C must not.
test('runs the jobs at once on SIGINT even when a delay is configured', async () => {
	const { jobsWaitedMs, exitCode } = await terminate('SIGINT', 600)

	expect(jobsWaitedMs).toBeLessThan(400)
	expect(exitCode).toBe(130)
})
