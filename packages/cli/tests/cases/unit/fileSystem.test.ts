import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileSystem } from '../../../src/lib/fs/FileSystem.js'

describe('FileSystem.listDirectories', () => {
	let dir: string
	const fs = new FileSystem()

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'contember-cli-fs-'))
		for (const it of ['packages/a', 'packages/b', 'packages/.hidden', 'packages/c/nested', 'apps/x']) {
			await mkdir(join(dir, it), { recursive: true })
		}
		await writeFile(join(dir, 'packages/file.txt'), '')
		await symlink(join(dir, 'apps/x'), join(dir, 'packages/link'))
	})

	afterAll(async () => {
		await rm(dir, { recursive: true, force: true })
	})

	const list = async (patterns: string[]) => (await fs.listDirectories(dir, patterns)).sort()

	test('matches directories only, skips dot directories, follows symlinks', async () => {
		expect(await list(['packages/*'])).toEqual(['packages/a', 'packages/b', 'packages/c', 'packages/link'])
	})

	test('globstar does not return its base directory', async () => {
		expect(await list(['packages/**'])).toEqual(['packages/a', 'packages/b', 'packages/c', 'packages/c/nested', 'packages/link'])
	})

	test('negated patterns exclude, literal and overlapping patterns are deduplicated', async () => {
		expect(await list(['packages/*', 'apps/*', 'packages/a', '!packages/b'])).toEqual(['apps/x', 'packages/a', 'packages/c', 'packages/link'])
	})

	test('a literal pattern returns the base of another globstar pattern', async () => {
		expect(await list(['packages/**', 'packages'])).toEqual([
			'packages',
			'packages/a',
			'packages/b',
			'packages/c',
			'packages/c/nested',
			'packages/link',
		])
	})

	test('leading ./ is normalised', async () => {
		expect(await list(['./apps/*'])).toEqual(['apps/x'])
	})

	test('no positive pattern matches nothing', async () => {
		expect(await list([])).toEqual([])
		expect(await list(['!packages/a'])).toEqual([])
	})
})
