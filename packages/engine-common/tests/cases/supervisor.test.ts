import { createLogger, TestLoggerHandler } from '@contember/logger'
import { test, expect } from 'bun:test'
import { Runnable, RunnableArgs, Running, Supervisor } from '../../src'

const shouldNotHappenCallback = () => {
	throw new Error('should not happen')
}

const createTestLogger = (out = false) => {
	const testHandler = new TestLoggerHandler(out)
	const logger = createLogger(testHandler)
	return { logger, testLogger: testHandler }
}

test('supervisor: start - end', async () => {
	const { logger, testLogger } = createTestLogger()
	const okRunnable = new class OkRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			logger.info('Starting runnable')
			await new Promise(resolve => setTimeout(resolve, 1))
			logger.info('Runnable started')
			return {
				end: async () => {
					logger.info('Runnable terminated')
				},
			}
		}
	}
	const supervisor = new Supervisor(okRunnable)
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await running.end()
	expect(testLogger.messages.map(it => it.message)).toStrictEqual([
		'Starting runnable',
		'Runnable started',
		'Runnable terminated',
	])
})


test('supervisor: retry start', async () => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	const okRunnable = new class OkRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			logger.info(`Starting runnable #${thisAttempt}`)
			await new Promise(resolve => setTimeout(resolve, 1))
			if (thisAttempt < 3) {
				logger.info(`Runnable #${thisAttempt} failed to start`)
				throw new Error()
			}
			logger.info(`Runnable #${thisAttempt} started`)
			return {
				end: async () => {
					logger.info(`Runnable #${thisAttempt} terminated`)
				},
			}
		}
	}

	const supervisor = new Supervisor(okRunnable, { minBackoff: 1 })
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await running.end()
	expect(testLogger.messages.map(it => it.message)).toStrictEqual([
		'Starting runnable #1',
		'Runnable #1 failed to start',
		'Runnable crashed, restarting in 1 ms ...',
		'Restarting runnable now',
		'Starting runnable #2',
		'Runnable #2 failed to start',
		'Runnable crashed, restarting in 2 ms ...',
		'Restarting runnable now',
		'Starting runnable #3',
		'Runnable #3 started',
		'Runnable #3 terminated',

	])
})


test('supervisor: failed to start', async () => {
	const { logger, testLogger } = createTestLogger()
	const okRunnable = new class OkRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			logger.info(`Starting runnable`)
			await new Promise(resolve => setTimeout(resolve, 1))
			throw new Error('failed to start')
		}
	}

	const supervisor = new Supervisor(okRunnable, { startupMax: 0 })
	const runningPromise = supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await expect(runningPromise).rejects.toThrow('failed to start')
	expect(testLogger.messages.map(it => it.message)).toStrictEqual([
		'Starting runnable',
		'Runnable crashed, stopping: failed to start',
	])
})


test('supervisor: crash after start, restarts', async () => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	const okRunnable = new class OkRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			logger.info(`Starting runnable #${thisAttempt}`)
			await new Promise(resolve => setTimeout(resolve, 1))
			if (thisAttempt === 1) {
				setTimeout(() => {
					args.onError(new Error())
				}, 50)
			}
			return {
				end: async () => {
					logger.info(`Runnable #${thisAttempt} terminated`)
					args.onClose()
				},
			}
		}
	}

	const supervisor = new Supervisor(okRunnable, { minBackoff: 1 })
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await new Promise(resolve => setTimeout(resolve, 100))
	await running.end()
	expect(testLogger.messages.map(it => it.message)).toStrictEqual([
		'Starting runnable #1',
		'Runnable crashed, restarting in 1 ms ...',
		'Restarting runnable now',
		'Starting runnable #2',
		'Runnable #2 terminated',

	])
})


test('supervisor: failed to restart', async () => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	const okRunnable = new class OkRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			logger.info(`Starting runnable #${thisAttempt}`)
			await new Promise(resolve => setTimeout(resolve, 1))
			if (thisAttempt === 1) {
				setTimeout(() => {
					args.onError(new Error())
				}, 50)
			} else {
				throw new Error('failed to restart')
			}
			return {
				end: async () => {
					logger.info(`Runnable #${thisAttempt} terminated`)
					args.onClose()
				},
			}
		}
	}

	const supervisor = new Supervisor(okRunnable, { minBackoff: 1, max: 5 })
	const errorPromise = new Promise(async (resolve, reject) => {
		await supervisor.run({
			logger,
			onError: reject,
		})
	})

	await expect(errorPromise).rejects.toThrow('failed to restart')

	expect(testLogger.messages.map(it => it.message)).toStrictEqual([
		'Starting runnable #1',
		'Runnable crashed, restarting in 1 ms ...',
		'Restarting runnable now',
		'Starting runnable #2',
		'Runnable crashed, restarting in 2 ms ...: failed to restart',
		'Restarting runnable now',
		'Starting runnable #3',
		'Runnable crashed, restarting in 4 ms ...: failed to restart',
		'Restarting runnable now',
		'Starting runnable #4',
		'Runnable crashed, restarting in 8 ms ...: failed to restart',
		'Restarting runnable now',
		'Starting runnable #5',
		'Runnable crashed, restarting in 16 ms ...: failed to restart',
		'Restarting runnable now',
		'Starting runnable #6',
		'Runnable crashed, stopping: failed to restart',
	])
})

