import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import { SnapshotFile, SnapshotManager } from '../../../src/index.js'

const sampleSnapshot: SnapshotFile = {
	version: '2024-01-02-120000',
	stateMode: true,
	snapshot: {
		formatVersion: 6,
		modifications: [{ modification: 'createEntity', entity: { name: 'Foo' } } as any],
	},
	covers: [
		{ version: '2024-01-01-120000', name: '2024-01-01-120000-init', type: 'schema', checksum: 'abc' },
		{ version: '2024-01-02-120000', name: '2024-01-02-120000-seed', type: 'content', checksum: null },
	],
	contentMigrations: ['2024-01-02-120000'],
}

describe('SnapshotManager', () => {
	let baseDir: string
	let snapshotPath: string
	let manager: SnapshotManager

	beforeEach(async () => {
		baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contember-snapshot-'))
		snapshotPath = path.join(baseDir, 'snapshot.json')
		manager = new SnapshotManager(snapshotPath)
	})

	afterEach(async () => {
		await fs.rm(baseDir, { recursive: true, force: true })
	})

	test('exists is false when the snapshot file is absent', async () => {
		expect(await manager.exists()).toBe(false)
	})

	test('exists is false when the path is a directory', async () => {
		await fs.mkdir(snapshotPath)
		expect(await manager.exists()).toBe(false)
	})

	test('write then read round-trips the snapshot', async () => {
		await manager.write(sampleSnapshot)

		expect(await manager.exists()).toBe(true)
		expect(await manager.read()).toStrictEqual(sampleSnapshot)
	})

	test('write produces tab-indented JSON with a trailing newline', async () => {
		await manager.write(sampleSnapshot)

		const content = await fs.readFile(snapshotPath, 'utf8')
		expect(content.endsWith('}\n')).toBe(true)
		expect(content).toContain('\n\t"version"')
	})

	test('read throws a descriptive error for malformed JSON', async () => {
		await fs.writeFile(snapshotPath, '{ not json')
		await expect(manager.read()).rejects.toThrow(/Failed to read snapshot file/)
	})
})
