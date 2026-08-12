import { describe, expect, test } from 'bun:test'

const nestedDirectiveScript = `
const childProcess = require('node:child_process')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

childProcess.exec = (_command, callback) => {
	callback(new Error('remote-secret\\u001b[2J'), '', '')
}

const degit = require('degit')

;(async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-degit-patch-'))
	const cacheDirectory = path.join(root, 'cache')
	const destination = path.join(root, 'destination')
	await fs.mkdir(destination)
	await fs.writeFile(path.join(destination, 'template.txt'), 'template')

	const parent = degit('owner/parent', { cache: false, force: true, verbose: false })
	const warningCodes = []
	parent.on('warn', event => warningCodes.push(event.code))

	const consoleCalls = []
	const exitCalls = []
	const originalConsoleError = console.error
	const originalExit = process.exit
	console.error = (...values) => consoleCalls.push(values)
	process.exit = code => {
		exitCalls.push(code)
		throw new Error('unexpected process.exit')
	}

	let rejection = ''
	try {
		await parent.directiveActions.clone(cacheDirectory, destination, {
			action: 'clone',
			src: 'owner/nested',
			cache: false,
			verbose: false,
		})
	} catch (error) {
		rejection = error instanceof Error ? error.message : String(error)
	} finally {
		console.error = originalConsoleError
		process.exit = originalExit
		await fs.rm(root, { recursive: true, force: true })
	}

	process.stdout.write(JSON.stringify({ warningCodes, consoleCalls: consoleCalls.length, exitCalls, rejection }))
})().catch(error => {
	console.error(error)
	process.exitCode = 1
})
`

describe('patched degit directive handling', () => {
	test('re-emits nested warnings and propagates rejection without process output or exit', async () => {
		const child = Bun.spawn(['node', '-e', nestedDirectiveScript], {
			cwd: process.cwd(),
			stdout: 'pipe',
			stderr: 'pipe',
		})
		const [stdout, stderr, exitCode] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		])

		expect(exitCode).toBe(0)
		expect(stderr).toBe('')
		expect(stdout).toBe(
			'{"warningCodes":["COULD_NOT_FETCH"],"consoleCalls":0,"exitCalls":[],"rejection":"could not find commit hash for HEAD"}',
		)
		expect(stdout).not.toContain('remote-secret')
		expect(stdout).not.toContain('\u001b')
	})
})
