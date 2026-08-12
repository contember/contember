import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repoRoot = resolve(import.meta.dir, '../../../../..')
const entrypoint = join(repoRoot, 'packages/create/src/run.ts')
const temporaryDirectories: string[] = []

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

const runCreate = async (cwd: string, args: string[]) => {
	const process = Bun.spawn(['bun', '--conditions=typescript', entrypoint, ...args], {
		cwd,
		env: { ...Bun.env, NO_COLOR: '1' },
		stdin: 'ignore',
		stdout: 'pipe',
		stderr: 'pipe',
	})
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	])
	return { stdout, stderr, exitCode }
}

describe('@contember/create process output', () => {
	test('writes a successful JSON result to stdout only', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'contember-create-process-'))
		temporaryDirectories.push(cwd)

		const result = await runCreate(cwd, ['demo', '--json'])

		expect(result.exitCode).toBe(0)
		expect(result.stderr).toBe('')
		expect(JSON.parse(result.stdout)).toMatchObject({
			projectName: 'demo',
			projectDirectory: join(cwd, 'demo'),
			template: 'default',
		})
	})

	test('writes a structured JSON error to stderr only', async () => {
		const cwd = await mkdtemp(join(tmpdir(), 'contember-create-process-'))
		temporaryDirectories.push(cwd)

		const result = await runCreate(cwd, ['--json'])

		expect(result.exitCode).toBe(1)
		expect(result.stdout).toBe('')
		expect(JSON.parse(result.stderr)).toMatchObject({
			ok: false,
			error: { retryable: false },
		})
	})
})
