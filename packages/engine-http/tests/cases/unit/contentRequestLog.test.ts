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

const createLog = async (options: Partial<ContentRequestLogOptions> = {}, now?: () => number) => {
	const directory = await mkdtemp(join(tmpdir(), 'content-request-log-'))
	directories.push(directory)
	const file = join(directory, 'requests.jsonl')
	const loggerHandler = new TestLoggerHandler()
	const log = new ContentRequestLog({ projects: ['test'], file, maxRequests: 10, ...options }, createLogger(loggerHandler), now)
	return { log, file, loggerHandler }
}

const readEntries = async (file: string): Promise<unknown[]> => (await readFile(file, 'utf8')).split('\n').filter(Boolean).map(it => JSON.parse(it))

const entry = (project: string) => ({ project, stage: 'live', roles: ['editor'], request: { query: '{ marker }' }, status: 200 })

test('the controller records a request of a listed project with its stage, roles, request and status', async () => {
	const { log, file } = await createLog({}, () => Date.parse('2026-01-02T03:04:05Z'))
	const harness = createContentControllerHarness('graphql-js', { roles: ['editor'], requestLog: log })
	try {
		await harness.request('query Marker { marker }', {}, { note: 'client data' })
		await harness.request('mutation { unknown }')
	} finally {
		await harness.close()
	}
	await log.close()

	expect(await readEntries(file)).toEqual([
		{
			time: '2026-01-02T03:04:05.000Z',
			project: 'test',
			stage: 'live',
			roles: ['editor'],
			query: 'query Marker { marker }',
			variables: { note: 'client data' },
			status: 200,
		},
		{ time: '2026-01-02T03:04:05.000Z', project: 'test', stage: 'live', roles: ['editor'], query: 'mutation { unknown }', status: 400 },
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

test('recording stops once the duration has passed', async () => {
	let now = 1_000_000
	const { log, file } = await createLog({ durationSeconds: 60 }, () => now)
	log.record(entry('test'))
	now += 60_000
	log.record(entry('test'))
	await log.close()

	expect(await readEntries(file)).toHaveLength(1)
})

test('the log file is readable by its owner only', async () => {
	const { log, file } = await createLog()
	log.record(entry('test'))
	await log.close()

	expect((await stat(file)).mode & 0o777).toBe(0o600)
})

test('a destination that cannot be written stops the log instead of failing requests', async () => {
	const { log, file, loggerHandler } = await createLog()
	const unwritable = new ContentRequestLog(
		{ projects: ['test'], file: join(file, 'missing-directory', 'requests.jsonl'), maxRequests: 10 },
		createLogger(loggerHandler),
	)
	unwritable.record(entry('test'))
	await new Promise(resolve => setTimeout(resolve, 50))

	expect(unwritable.accepts('test')).toBe(false)
	expect(loggerHandler.messages.map(it => it.message)).toContainEqual(expect.stringContaining('Content API request log failed and is stopped'))
	await unwritable.close()
	await log.close()
})
