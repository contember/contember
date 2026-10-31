import { createLogger, TestLoggerHandler } from '@contember/logger'
import { expect, test } from 'bun:test'
import { Runnable, RunnableArgs, Running, Supervisor } from '../../src/index.js'

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
	}()
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
	}()

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
	}()

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
	}()

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
	}()

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

test('supervisor: backs off restarts after a healthy run without max', async () => {
	const { logger, testLogger } = createTestLogger()
	const lastAttempt = 7
	let attempt = 0
	let reachedLastAttempt: () => void = () => {}
	const lastAttemptPromise = new Promise<void>(resolve => {
		reachedLastAttempt = resolve
	})
	const runnable = new class FailingRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			if (thisAttempt === 1) {
				setTimeout(() => args.onError(new Error('crashed')), 1)
				return { end: async () => {} }
			}
			if (thisAttempt === lastAttempt) {
				reachedLastAttempt()
				return { end: async () => {} }
			}
			throw new Error('dependency unavailable')
		}
	}()

	const supervisor = new Supervisor(runnable, { minBackoff: 1, maxBackoff: 16 })
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await lastAttemptPromise
	await running.end()
	expect(testLogger.messages.map(it => it.message).filter(it => it.startsWith('Runnable crashed'))).toStrictEqual([
		'Runnable crashed, restarting in 1 ms ...: crashed',
		'Runnable crashed, restarting in 2 ms ...: dependency unavailable',
		'Runnable crashed, restarting in 4 ms ...: dependency unavailable',
		'Runnable crashed, restarting in 8 ms ...: dependency unavailable',
		'Runnable crashed, restarting in 16 ms ...: dependency unavailable',
		'Runnable crashed, restarting in 16 ms ...: dependency unavailable',
	])
})

const runFlappingRunnable = async (options: { stableAfter?: number; uptimeMs: (attempt: number) => number; attempts: number }) => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	let reachedLastAttempt: () => void = () => {}
	const lastAttemptPromise = new Promise<void>(resolve => {
		reachedLastAttempt = resolve
	})
	const runnable = new class FlappingRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			if (thisAttempt === options.attempts) {
				reachedLastAttempt()
			} else {
				setTimeout(() => args.onError(new Error(`crashed #${thisAttempt}`)), options.uptimeMs(thisAttempt))
			}
			return { end: async () => {} }
		}
	}()

	const supervisor = new Supervisor(runnable, { minBackoff: 1, maxBackoff: 16, stableAfter: options.stableAfter })
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await lastAttemptPromise
	await running.end()
	return testLogger.messages.map(it => it.message).filter(it => it.startsWith('Runnable crashed'))
}

test('supervisor: backs off a runnable that crashes right after every start', async () => {
	expect(await runFlappingRunnable({ uptimeMs: () => 1, attempts: 7 })).toStrictEqual([
		'Runnable crashed, restarting in 1 ms ...: crashed #1',
		'Runnable crashed, restarting in 2 ms ...: crashed #2',
		'Runnable crashed, restarting in 4 ms ...: crashed #3',
		'Runnable crashed, restarting in 8 ms ...: crashed #4',
		'Runnable crashed, restarting in 16 ms ...: crashed #5',
		'Runnable crashed, restarting in 16 ms ...: crashed #6',
	])
})

test('supervisor: resets the backoff after a run stays up for stableAfter', async () => {
	expect(await runFlappingRunnable({ stableAfter: 200, uptimeMs: attempt => attempt === 4 ? 250 : 1, attempts: 6 })).toStrictEqual([
		'Runnable crashed, restarting in 1 ms ...: crashed #1',
		'Runnable crashed, restarting in 2 ms ...: crashed #2',
		'Runnable crashed, restarting in 4 ms ...: crashed #3',
		'Runnable crashed, restarting in 1 ms ...: crashed #4',
		'Runnable crashed, restarting in 2 ms ...: crashed #5',
	])
})

test('supervisor: does not count backoff as uptime of a run that crashed before run() returned', async () => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	let reachedLastAttempt: () => void = () => {}
	const lastAttemptPromise = new Promise<void>(resolve => {
		reachedLastAttempt = resolve
	})
	const runnable = new class InstantlyCrashingRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			return await new Promise<Running>(async resolve => {
				resolve({ end: async () => {} })
				if (thisAttempt === 8) {
					reachedLastAttempt()
					return
				}
				await Promise.resolve()
				args.onError(new Error(`crashed #${thisAttempt}`))
			})
		}
	}()

	const supervisor = new Supervisor(runnable, { minBackoff: 1, maxBackoff: 16, stableAfter: 10 })
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await lastAttemptPromise
	await running.end()
	expect(testLogger.messages.map(it => it.message).filter(it => it.startsWith('Runnable crashed'))).toStrictEqual([
		'Runnable crashed, restarting in 1 ms ...: crashed #1',
		'Runnable crashed, restarting in 2 ms ...: crashed #2',
		'Runnable crashed, restarting in 4 ms ...: crashed #3',
		'Runnable crashed, restarting in 8 ms ...: crashed #4',
		'Runnable crashed, restarting in 16 ms ...: crashed #5',
		'Runnable crashed, restarting in 16 ms ...: crashed #6',
		'Runnable crashed, restarting in 16 ms ...: crashed #7',
	])
})

test('supervisor: first successful start resets the startup backoff', async () => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	let reachedLastAttempt: () => void = () => {}
	const lastAttemptPromise = new Promise<void>(resolve => {
		reachedLastAttempt = resolve
	})
	const runnable = new class SlowStartingRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			if (thisAttempt <= 3) {
				throw new Error(`failed to start #${thisAttempt}`)
			}
			if (thisAttempt === 5) {
				reachedLastAttempt()
			} else {
				setTimeout(() => args.onError(new Error(`crashed #${thisAttempt}`)), 1)
			}
			return { end: async () => {} }
		}
	}()

	const supervisor = new Supervisor(runnable, { minBackoff: 1 })
	const running = await supervisor.run({
		logger,
		onError: shouldNotHappenCallback,
	})
	await lastAttemptPromise
	await running.end()
	expect(testLogger.messages.map(it => it.message).filter(it => it.startsWith('Runnable crashed'))).toStrictEqual([
		'Runnable crashed, restarting in 1 ms ...: failed to start #1',
		'Runnable crashed, restarting in 2 ms ...: failed to start #2',
		'Runnable crashed, restarting in 4 ms ...: failed to start #3',
		'Runnable crashed, restarting in 1 ms ...: crashed #4',
	])
})

test('supervisor: max limits restarts of runs that crash before becoming stable', async () => {
	const { logger, testLogger } = createTestLogger()
	let attempt = 0
	const runnable = new class FlappingRunnable implements Runnable {
		async run(args: RunnableArgs): Promise<Running> {
			const thisAttempt = ++attempt
			setTimeout(() => args.onError(new Error(`crashed #${thisAttempt}`)), 1)
			return { end: async () => {} }
		}
	}()

	const supervisor = new Supervisor(runnable, { minBackoff: 1, max: 3 })
	const errorPromise = new Promise(async (resolve, reject) => {
		await supervisor.run({
			logger,
			onError: reject,
		})
	})

	await expect(errorPromise).rejects.toThrow('crashed #4')
	expect(testLogger.messages.map(it => it.message).filter(it => it.startsWith('Runnable crashed'))).toStrictEqual([
		'Runnable crashed, restarting in 1 ms ...: crashed #1',
		'Runnable crashed, restarting in 2 ms ...: crashed #2',
		'Runnable crashed, restarting in 4 ms ...: crashed #3',
		'Runnable crashed, stopping: crashed #4',
	])
})
