import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileSystem } from '../../../src/lib/FileSystem.js'
import { TemplateInstaller } from '../../../src/lib/TemplateInstaller.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

interface Fixture {
	installer: TemplateInstaller
	templateDir: string
	/** The project the installer creates; it does not exist before the install. */
	target: string
	/** A sibling of the project holding `victim.txt`; directives must never touch it. */
	outside: string
}

/** Layout: `<root>/resources/templates/default`, `<root>/work/project` (target) and `<root>/work/outside`. */
const createFixture = async (config: string): Promise<Fixture> => {
	const root = await mkdtemp(join(tmpdir(), 'contember-template-containment-'))
	temporaryDirectories.push(root)
	const templateDir = join(root, 'resources/templates/default')
	await mkdir(join(templateDir, 'sub'), { recursive: true })
	await writeFile(join(templateDir, 'contember.template.yaml'), config)
	await writeFile(join(templateDir, 'README.md'), 'readme {projectName}')
	const outside = join(root, 'work/outside')
	await mkdir(outside, { recursive: true })
	await writeFile(join(outside, 'victim.txt'), 'victim {projectName}')
	const installer = new TemplateInstaller(join(root, 'resources'), new FileSystem(), { warn: () => {} })
	return { installer, templateDir, target: join(root, 'work/project'), outside }
}

const expectOutsideUntouched = async (outside: string) => {
	expect((await readdir(outside)).sort()).toEqual(['victim.txt'])
	expect(await readFile(join(outside, 'victim.txt'), 'utf8')).toBe('victim {projectName}')
}

const install = (fixture: Fixture) => fixture.installer.installTemplate('default', fixture.target, { projectName: 'acme' })

describe('template directives stay inside the project', () => {
	const traversal: [string, string][] = [
		['rename source with ..', 'rename:\n  ../outside/victim.txt: stolen.txt\n'],
		['rename target with ..', 'rename:\n  README.md: ../outside/planted.txt\n'],
		['copy source with ..', 'copy:\n  ../outside: stolen\n'],
		['copy target with ..', 'copy:\n  README.md: ../outside/planted.txt\n'],
		['copy target with .. in the middle', 'copy:\n  README.md: sub/../../outside/planted.txt\n'],
		['replaceVariables with ..', 'replaceVariables:\n  - ../outside/victim.txt\n'],
	]
	for (const [name, config] of traversal) {
		test(`refuses a ${name}`, async () => {
			const fixture = await createFixture(config)
			await expect(install(fixture)).rejects.toThrow('points outside the project')
			await expectOutsideUntouched(fixture.outside)
		})
	}

	test('refuses absolute paths', async () => {
		for (const directive of ['rename', 'copy']) {
			const probe = await createFixture('{}')
			const fixture = await createFixture(`${directive}:\n  README.md: ${JSON.stringify(join(probe.outside, 'planted.txt'))}\n`)
			await expect(install(fixture)).rejects.toThrow('points outside the project')
			await expectOutsideUntouched(probe.outside)
		}
		const fixture = await createFixture('{}')
		const absolute = await createFixture(`replaceVariables:\n  - ${JSON.stringify(join(fixture.outside, 'victim.txt'))}\n`)
		await expect(install(absolute)).rejects.toThrow('points outside the project')
		await expectOutsideUntouched(fixture.outside)
	})

	test('refuses the project directory itself', async () => {
		const fixture = await createFixture('rename:\n  sub/..: renamed\n')
		await expect(install(fixture)).rejects.toThrow('points outside the project')
	})

	const throughSymlink: [string, string][] = [
		['rename target', 'rename:\n  README.md: link/planted.txt\n'],
		['rename source', 'rename:\n  link/victim.txt: stolen.txt\n'],
		['copy target', 'copy:\n  README.md: link/planted.txt\n'],
		['copy target in a new directory', 'copy:\n  README.md: link/new/planted.txt\n'],
		['copy source', 'copy:\n  link: stolen\n'],
		['replaceVariables', 'replaceVariables:\n  - link/victim.txt\n'],
	]
	for (const [name, config] of throughSymlink) {
		test(`refuses a ${name} through a symlink that leaves the project`, async () => {
			const fixture = await createFixture(config)
			await symlink(fixture.outside, join(fixture.templateDir, 'link'))
			await expect(install(fixture)).rejects.toThrow('points outside the project')
			await expectOutsideUntouched(fixture.outside)
		})
	}

	test('refuses a copy onto a dangling symlink that leaves the project', async () => {
		const fixture = await createFixture('copy:\n  README.md: dangling\n')
		await symlink(join(fixture.outside, 'planted.txt'), join(fixture.templateDir, 'dangling'))
		await expect(install(fixture)).rejects.toThrow('passes through a dangling symlink')
		await expectOutsideUntouched(fixture.outside)
	})

	test('refuses a copy into an existing directory, whose entries could be symlinks that leave the project', async () => {
		const fixture = await createFixture('copy:\n  src: dst\n')
		await mkdir(join(fixture.templateDir, 'src/vdir'), { recursive: true })
		await writeFile(join(fixture.templateDir, 'src/vdir/planted.txt'), 'planted')
		await writeFile(join(fixture.templateDir, 'src/victim.txt'), 'overwritten')
		await mkdir(join(fixture.templateDir, 'dst'))
		await symlink(fixture.outside, join(fixture.templateDir, 'dst/vdir'))
		await symlink(join(fixture.outside, 'victim.txt'), join(fixture.templateDir, 'dst/victim.txt'))
		await expect(install(fixture)).rejects.toThrow('Template path "dst" already exists')
		await expectOutsideUntouched(fixture.outside)
	})

	test('refuses a copy onto an existing file', async () => {
		const fixture = await createFixture('copy:\n  README.md: sub/README.md\n')
		await writeFile(join(fixture.templateDir, 'sub/README.md'), 'kept')
		await expect(install(fixture)).rejects.toThrow('Template path "sub/README.md" already exists')
		expect(await readFile(join(fixture.target, 'sub/README.md'), 'utf8')).toBe('kept')
	})

	test('still applies directives inside the project, also through a symlink inside it', async () => {
		const fixture = await createFixture(
			'rename:\n  README.md: inner/README.md\ncopy:\n  sub: new/nested/copy\nreplaceVariables:\n  - sub/README.md\n  - missing.txt\n',
		)
		await symlink(join(fixture.target, 'sub'), join(fixture.templateDir, 'inner'))
		await install(fixture)
		expect(await readFile(join(fixture.target, 'sub/README.md'), 'utf8')).toBe('readme acme')
		expect(await readFile(join(fixture.target, 'new/nested/copy/README.md'), 'utf8')).toBe('readme {projectName}')
		await expectOutsideUntouched(fixture.outside)
	})
})
