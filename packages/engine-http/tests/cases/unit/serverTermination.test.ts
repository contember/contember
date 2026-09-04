import { expect, test } from 'bun:test'
import { createTerminationExecutor, executeTerminationJobs, TerminationJob } from '../../../src/utils/serverTermination.js'

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
