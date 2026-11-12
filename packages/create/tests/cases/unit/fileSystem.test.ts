import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname } from 'node:path'
import { FileSystem } from '../../../src/lib/FileSystem.js'

test('creates the temporary directory inside the OS temp directory', async () => {
	const dir = await new FileSystem().createTempDir()
	try {
		expect(dirname(dir)).toBe(tmpdir())
	} finally {
		await rm(dir, { recursive: true, force: true })
	}
})
