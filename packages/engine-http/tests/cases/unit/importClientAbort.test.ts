import { expect, test } from 'bun:test'
import { join } from 'node:path'

// A subprocess, because the happy-dom globals of the test preload keep an in-process server from seeing the abort.
const fixture = join(import.meta.dir, 'importClientAbort.fixture.ts')
// Bun before 1.3.14 never reports a dropped client to node:http, so no code can observe the abort there.
const abortUnobservable = Bun.semver.order(Bun.version, '1.3.14') < 0

const readUpload = async (encoding: 'gzip' | 'plain', upload: 'abort' | 'complete'): Promise<string> => {
	const proc = Bun.spawn(['bun', '--conditions=typescript', fixture, encoding, upload], { stdout: 'pipe', stderr: 'inherit' })
	const output = await new Response(proc.stdout).text()
	await proc.exited
	return output.trim()
}

test.skipIf(abortUnobservable)('stops reading a gzip import when the client drops the connection mid-upload', async () => {
	expect(await readUpload('gzip', 'abort')).toBe('REJECTED')
})

test.skipIf(abortUnobservable)('stops reading a plain import when the client drops the connection mid-upload', async () => {
	expect(await readUpload('plain', 'abort')).toBe('REJECTED')
})

test('reads a complete gzip import to the end', async () => {
	expect(await readUpload('gzip', 'complete')).toBe('COMPLETED')
})
