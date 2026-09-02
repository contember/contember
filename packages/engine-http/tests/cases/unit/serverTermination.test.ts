import { expect, test } from 'bun:test'
import { join } from 'node:path'
import { createTerminationExecutor, executeTerminationJobs, TerminationJob } from '../../../src/utils/serverTermination.js'

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

test('termination jobs finish concurrently before final jobs start, including after a rejection', async () => {
	const events: string[] = []
	let finishFirst = () => {}
	const firstFinished = new Promise<void>(resolve => {
		finishFirst = resolve
	})
	const jobs: TerminationJob[] = [
		async () => {
			events.push('first started')
			await firstFinished
			events.push('first finished')
		},
		async () => {
			events.push('second started')
			throw new Error('producer failed')
		},
	]
	const finalJobs: TerminationJob[] = [async () => {
		events.push('final started')
	}]

	const running = executeTerminationJobs(jobs, finalJobs, { signal: 'SIGTERM', code: 15 })
	await new Promise<void>(resolve => setImmediate(resolve))

	expect(events).toStrictEqual(['first started', 'second started'])
	finishFirst()
	await running
	expect(events).toStrictEqual(['first started', 'second started', 'first finished', 'final started'])
})

test('repeated termination requests share one execution', async () => {
	let executions = 0
	const execute = createTerminationExecutor([async () => {
		executions++
	}], [async () => {
		executions++
	}])
	const args: Parameters<TerminationJob>[0] = { signal: 'SIGTERM', code: 15 }

	const first = execute(args)
	const second = execute(args)

	expect(second).toBe(first)
	await first
	expect(executions).toBe(2)
})
