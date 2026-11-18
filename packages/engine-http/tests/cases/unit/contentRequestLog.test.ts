import { afterEach, expect, test } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { ContentRequestLog, ContentRequestLogOptions } from '../../../src/content/ContentRequestLog.js'
import { createContentControllerHarness } from '../../contentControllerHarness.js'

const directories: string[] = []

afterEach(async () => {
	await Promise.all(directories.splice(0).map(it => rm(it, { recursive: true, force: true })))
})

const now = Date.parse('2026-01-02T03:04:05Z')

const createLog = async (options: Partial<ContentRequestLogOptions> = {}, clock: () => number = () => now) => {
	const directory = await mkdtemp(join(tmpdir(), 'content-request-log-'))
	directories.push(directory)
	const file = join(directory, 'requests.jsonl')
	const loggerHandler = new TestLoggerHandler()
	const log = new ContentRequestLog(
		{ projects: ['test'], file, maxRequests: 10, until: '2026-01-03T00:00:00.000Z', ...options },
		createLogger(loggerHandler),
		clock,
	)
	return { log, file, loggerHandler }
}

const readEntries = async (file: string): Promise<unknown[]> => (await readFile(file, 'utf8')).split('\n').filter(Boolean).map(it => JSON.parse(it))

const entry = (project: string) => ({
	projectGroup: undefined,
	project,
	stage: 'live',
	roles: ['editor'],
	method: 'POST',
	request: { query: '{ marker }' },
	status: 200,
})

const waitFor = async (condition: () => boolean) => {
	for (let attempt = 0; attempt < 100 && !condition(); attempt++) {
		await new Promise(resolve => setTimeout(resolve, 10))
	}
	expect(condition()).toBe(true)
}

test('the controller records a request of a listed project with its stage, roles, request and status', async () => {
	const { log, file } = await createLog()
	const harness = createContentControllerHarness('graphql-js', { roles: ['editor'], requestLog: log })
	try {
		await harness.request('query Marker { marker }', {}, { note: 'client data' })
		await harness.request('mutation { unknown }')
	} finally {
		await harness.close()
	}
	await log.close()

	const recorded = { time: '2026-01-02T03:04:05.000Z', projectGroup: null, project: 'test', stage: 'live', roles: ['editor'], method: 'POST' }
	expect(await readEntries(file)).toEqual([
		{ ...recorded, query: 'query Marker { marker }', variables: { note: 'client data' }, status: 200 },
		{ ...recorded, query: 'mutation { unknown }', status: 400 },
	])
})

test('a project that is not listed is not recorded', async () => {
	const { log, file } = await createLog({ projects: ['other'] })
	const harness = createContentControllerHarness('graphql-js', { requestLog: log })
	try {
		await harness.request('{ marker }')
	} finally {
		await harness.close()
	}
	await log.close()

	expect(existsSync(file)).toBe(false)
})

test('recording stops at the cap of each project', async () => {
	const { log, file, loggerHandler } = await createLog({ projects: ['test', 'other'], maxRequests: 2 })
	for (let i = 0; i < 3; i++) {
		log.record(entry('test'))
	}
	log.record(entry('other'))
	await log.close()

	const projects = (await readEntries(file)).map(it => typeof it === 'object' && it !== null ? Reflect.get(it, 'project') : undefined)
	expect(projects).toEqual(['test', 'test', 'other'])
	expect(log.accepts('test')).toBe(false)
	expect(loggerHandler.messages.map(it => it.message)).toContain('Content API request log reached its cap for a project')
})

test('nothing is recorded after `until`, also by a log created later, as after a restart', async () => {
	let clock = Date.parse('2026-01-02T23:59:59Z')
	const { log, file } = await createLog({}, () => clock)
	log.record(entry('test'))
	clock = Date.parse('2026-01-03T00:00:00Z')
	log.record(entry('test'))
	await log.close()

	const restarted = new ContentRequestLog(
		{ projects: ['test'], file, maxRequests: 10, until: '2026-01-03T00:00:00.000Z' },
		createLogger(new TestLoggerHandler()),
		() => clock,
	)
	restarted.record(entry('test'))
	await restarted.close()

	expect(await readEntries(file)).toHaveLength(1)
})

test('the log file is readable by its owner only', async () => {
	const { log, file } = await createLog()
	log.record(entry('test'))
	await log.close()

	expect((await stat(file)).mode & 0o777).toBe(0o600)
})

test('a destination that cannot be written stops the log, and the request still succeeds', async () => {
	const { file, loggerHandler } = await createLog()
	const unwritable = new ContentRequestLog(
		{ projects: ['test'], file: join(file, 'missing-directory', 'requests.jsonl'), maxRequests: 10, until: '2026-01-03T00:00:00.000Z' },
		createLogger(loggerHandler),
		() => now,
	)
	const harness = createContentControllerHarness('graphql-js', { requestLog: unwritable })
	try {
		const { koa } = await harness.request('{ marker }')
		expect(koa.status).toBe(200)
		expect(koa.body).toBe('{"data":{"marker":"replica"}}')
	} finally {
		await harness.close()
	}

	await waitFor(() => !unwritable.accepts('test'))
	expect(loggerHandler.messages.map(it => it.message)).toContainEqual(expect.stringContaining('Content API request log failed and is stopped'))
	await unwritable.close()
})
