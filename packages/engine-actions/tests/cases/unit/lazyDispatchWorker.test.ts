import { describe, expect, test } from 'bun:test'
import { Runnable, RunnableArgs, Running } from '@contember/engine-common'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { LazyDispatchWorker } from '../../../src/dispatch/LazyDispatchWorker'
import { DispatchWorkerSupervisorFactory } from '../../../src/dispatch/DispatchWorkerSupervisor'
import { ProjectGroupContainerResolver } from '@contember/engine-http'
import { ProjectGroupContainer } from '@contember/engine-http'

const silentLogger = createLogger(new TestLoggerHandler())

const tick = () => new Promise<void>(r => setImmediate(r))

const waitFor = async (cond: () => boolean, attempts = 50) => {
	for (let i = 0; i < attempts; i++) {
		if (cond()) return
		await tick()
	}
	throw new Error('waitFor: condition not met')
}

type FakeRunnable = Runnable & {
	id: string
	startCount: number
	endCount: number
	failOnRun?: () => Error | undefined
	emitError?: (e: any) => void
}

const createFakeSupervisor = (id: string, opts: { failOnRun?: () => Error | undefined } = {}): FakeRunnable => {
	const fake: FakeRunnable = {
		id,
		startCount: 0,
		endCount: 0,
		failOnRun: opts.failOnRun,
		async run(args: RunnableArgs): Promise<Running> {
			fake.startCount++
			const failure = fake.failOnRun?.()
			if (failure) {
				throw failure
			}
			fake.emitError = args.onError
			return {
				end: async () => {
					fake.endCount++
				},
			}
		},
	}
	return fake
}

type FakeResolver = Pick<ProjectGroupContainerResolver, 'on'> & {
	fire: (slug: string | undefined) => (() => void) | undefined
	listenerCount: () => number
}

const createFakeResolver = (): FakeResolver => {
	const listeners: Array<(args: { container: ProjectGroupContainer; slug: string | undefined }) => void | (() => void)> = []
	return {
		on(_event, cb) {
			listeners.push(cb as any)
			return () => {
				const idx = listeners.indexOf(cb as any)
				if (idx >= 0) listeners.splice(idx, 1)
			}
		},
		fire(slug) {
			const fakeContainer = { slug } as unknown as ProjectGroupContainer
			const cleanups = listeners.map(it => it({ container: fakeContainer, slug }))
			return () => cleanups.forEach(it => it?.())
		},
		listenerCount: () => listeners.length,
	}
}

const createFakeFactory = (registry: FakeRunnable[]): DispatchWorkerSupervisorFactory => {
	let counter = 0
	return {
		create(_container: ProjectGroupContainer): any {
			const fake = createFakeSupervisor(`fake-${counter++}`)
			registry.push(fake)
			return fake
		},
	} as any
}

const recordOnError = () => {
	const errors: any[] = []
	return { errors, onError: (e: any) => errors.push(e) }
}

describe('LazyDispatchWorker', () => {
	test('does not spawn supervisor before any project group is created', async () => {
		const resolver = createFakeResolver()
		const supervisors: FakeRunnable[] = []
		const worker = new LazyDispatchWorker(resolver as any, createFakeFactory(supervisors))
		const { onError } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })

		expect(supervisors).toHaveLength(0)
		expect(resolver.listenerCount()).toBe(1)

		await running.end()
		expect(resolver.listenerCount()).toBe(0)
	})

	test('spawns supervisor when project group is created', async () => {
		const resolver = createFakeResolver()
		const supervisors: FakeRunnable[] = []
		const worker = new LazyDispatchWorker(resolver as any, createFakeFactory(supervisors))
		const { onError, errors } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })

		resolver.fire('tenantA')
		await waitFor(() => supervisors.length === 1 && supervisors[0].startCount === 1)

		expect(supervisors[0].startCount).toBe(1)
		expect(supervisors[0].endCount).toBe(0)
		expect(errors).toHaveLength(0)

		await running.end()
		expect(supervisors[0].endCount).toBe(1)
	})

	test('spawns one supervisor per project group, isolated', async () => {
		const resolver = createFakeResolver()
		const supervisors: FakeRunnable[] = []
		const worker = new LazyDispatchWorker(resolver as any, createFakeFactory(supervisors))
		const { onError } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })

		resolver.fire('tenantA')
		resolver.fire('tenantB')
		await waitFor(() => supervisors.length === 2 && supervisors.every(it => it.startCount === 1))

		await running.end()
		expect(supervisors.map(it => it.endCount)).toEqual([1, 1])
	})

	test('container invalidation ends only that supervisor', async () => {
		const resolver = createFakeResolver()
		const supervisors: FakeRunnable[] = []
		const worker = new LazyDispatchWorker(resolver as any, createFakeFactory(supervisors))
		const { onError } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })

		const cleanupA = resolver.fire('tenantA')!
		resolver.fire('tenantB')
		await waitFor(() => supervisors.length === 2 && supervisors.every(it => it.startCount === 1))

		cleanupA()
		await waitFor(() => supervisors[0].endCount === 1)

		expect(supervisors[0].endCount).toBe(1)
		expect(supervisors[1].endCount).toBe(0)

		await running.end()
		expect(supervisors[1].endCount).toBe(1)
	})

	test('end() unsubscribes listener, no further supervisors are spawned', async () => {
		const resolver = createFakeResolver()
		const supervisors: FakeRunnable[] = []
		const worker = new LazyDispatchWorker(resolver as any, createFakeFactory(supervisors))
		const { onError } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })
		expect(resolver.listenerCount()).toBe(1)

		await running.end()
		expect(resolver.listenerCount()).toBe(0)

		resolver.fire('tenantLate')
		await tick()
		expect(supervisors).toHaveLength(0)
	})

	test('startup failure of a tenant supervisor propagates to onError once retries are exhausted', async () => {
		const resolver = createFakeResolver()
		const registry: FakeRunnable[] = []
		const factory: DispatchWorkerSupervisorFactory = {
			create(_container: ProjectGroupContainer): any {
				const fake = createFakeSupervisor(`fake-${registry.length}`, {
					failOnRun: () => new Error('boom'),
				})
				registry.push(fake)
				return fake
			},
		} as any
		const worker = new LazyDispatchWorker(resolver as any, factory, { startupMax: 0, minBackoff: 1 })
		const { onError, errors } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })

		resolver.fire('tenantBroken')
		await waitFor(() => errors.length > 0, 200)

		expect(errors[0]).toBeInstanceOf(Error)
		expect((errors[0] as Error).message).toContain('boom')

		await running.end()
	})

	test('errors after end() are swallowed', async () => {
		const resolver = createFakeResolver()
		const supervisors: FakeRunnable[] = []
		const worker = new LazyDispatchWorker(resolver as any, createFakeFactory(supervisors))
		const { onError, errors } = recordOnError()

		const running = await worker.run({ logger: silentLogger, onError })

		resolver.fire('tenantA')
		await waitFor(() => supervisors.length === 1 && supervisors[0].emitError !== undefined)

		await running.end()
		expect(supervisors[0].endCount).toBe(1)

		supervisors[0].emitError!(new Error('after end'))
		await tick()
		expect(errors).toHaveLength(0)
	})
})
