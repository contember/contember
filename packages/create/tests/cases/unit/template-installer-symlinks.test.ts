import { afterEach, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, readlink, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileSystem } from '../../../src/lib/FileSystem.js'
import { TemplateInstaller } from '../../../src/lib/TemplateInstaller.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

const createTempDir = async (prefix: string): Promise<string> => {
	const dir = await mkdtemp(join(tmpdir(), prefix))
	temporaryDirectories.push(dir)
	return dir
}

test('keeps relative symlinks of a remote template relative', async () => {
	const installer = new TemplateInstaller('/unused', new FileSystem(), { warn: () => {} }, async (_source, directory) => {
		await writeFile(join(directory, 'contember.template.yaml'), 'copy:\n  docs: docs-copy\n')
		await writeFile(join(directory, 'README.md'), 'readme')
		await mkdir(join(directory, 'docs'))
		await symlink('../README.md', join(directory, 'docs/README.md'))
		await symlink('README.md', join(directory, 'LINK.md'))
	})
	const target = join(await createTempDir('contember-template-target-'), 'project')

	await installer.installTemplate('owner/repository', target)

	expect(await readlink(join(target, 'LINK.md'))).toBe('README.md')
	expect(await readlink(join(target, 'docs/README.md'))).toBe('../README.md')
	expect(await readlink(join(target, 'docs-copy/README.md'))).toBe('../README.md')
	expect(await readFile(join(target, 'docs/README.md'), 'utf8')).toBe('readme')
	expect(await readFile(join(target, 'docs-copy/README.md'), 'utf8')).toBe('readme')
})
