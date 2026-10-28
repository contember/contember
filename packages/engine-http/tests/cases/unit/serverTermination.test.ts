import { expect, test } from 'vitest'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const fixture = join(__dirname, 'serverTermination.fixture.ts')

/** Starts the fixture, sends `signal` once it listens, and measures how long the termination jobs waited. */
const terminate = async (signal: 'SIGTERM' | 'SIGINT', sigtermDelayMs: number) => {
	const proc = spawn(process.execPath, ['--import', 'tsx', fixture, String(sigtermDelayMs)], { stdio: ['ignore', 'pipe', 'inherit'] })
	const exited = new Promise<number | null>(resolve => proc.once('exit', code => resolve(code)))
	let output = ''
	const waitFor = (marker: string): Promise<number> => new Promise((resolve, reject) => {
		const check = () => {
			if (output.includes(marker)) {
				proc.stdout.off('data', onData)
				proc.stdout.off('end', onEnd)
				resolve(performance.now())
			}
		}
		const onData = (chunk: Buffer) => {
			output += chunk.toString()
			check()
		}
		const onEnd = () => reject(new Error(`The fixture exited before printing ${marker}: ${output}`))
		proc.stdout.on('data', onData)
		proc.stdout.once('end', onEnd)
		check()
	})
	await waitFor('READY')
	const signalledAt = performance.now()
	proc.kill(signal)
	const jobsRanAt = await waitFor('JOBS')
	return { jobsWaitedMs: jobsRanAt - signalledAt, exitCode: await exited }
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
