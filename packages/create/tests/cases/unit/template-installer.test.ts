import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Output, OutputMode, OutputStream } from '@contember/cli-common'
import { FileSystem } from '../../../src/lib/FileSystem.js'
import { InvalidTemplatePathError, TemplateInstaller } from '../../../src/lib/TemplateInstaller.js'

class CapturingStream implements OutputStream {
	public chunks: string[] = []
	public readonly isTty = false

	public write(text: string): void {
		this.chunks.push(text)
	}

	public get text(): string {
		return this.chunks.join('')
	}
}

const testDirectories: string[] = []

afterEach(async () => {
	await Promise.all(testDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

const expectSafePathError = async (
	installation: Promise<void>,
	field: string,
	hostilePath: string,
	temporaryRoot: string,
): Promise<void> => {
	let caughtError: unknown
	try {
		await installation
	} catch (error) {
		caughtError = error
	}
	expect(caughtError).toBeInstanceOf(InvalidTemplatePathError)
	if (!(caughtError instanceof InvalidTemplatePathError)) {
		throw new Error('Expected InvalidTemplatePathError')
	}
	expect(caughtError.message).toBe(`Unsafe path in template configuration: ${field}.`)
	expect(caughtError.message).not.toContain(hostilePath)
	expect(caughtError.message).not.toContain(temporaryRoot)
	expect(caughtError.cause).toBeUndefined()
}

const runCleanupFailure = async (mode: OutputMode) => {
	const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
	testDirectories.push(root)
	const templateDirectory = join(root, 'template')
	const targetDirectory = join(root, 'workspace')
	const stdout = new CapturingStream()
	const stderr = new CapturingStream()
	const output = new Output({ stdout, stderr })
	output.setMode(mode)

	const fileSystem = new FileSystem()
	fileSystem.createTempDir = async () => templateDirectory
	fileSystem.remove = async () => {
		throw new Error('remote-secret\u001b[2J')
	}

	let verbose: boolean | undefined
	const installer = new TemplateInstaller('/unused', fileSystem, output, (_source, options) => {
		verbose = options.verbose
		return {
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(join(destination, 'contember.template.yaml'), '{}')
				await writeFile(join(destination, 'README.md'), 'template')
			},
		}
	})

	await installer.installTemplate('owner/repository', targetDirectory)

	return { stdout: stdout.text, stderr: stderr.text, verbose }
}

describe('TemplateInstaller cleanup output', () => {
	test('writes a sanitized generic warning in human mode', async () => {
		const result = await runCleanupFailure('human')

		expect(result).toEqual({
			stdout: '',
			stderr: 'Failed to clean up temporary template\n',
			verbose: false,
		})
		expect(result.stderr).not.toContain('remote-secret')
		expect(result.stderr).not.toContain('\u001b')
	})

	test('suppresses cleanup diagnostics in json mode', async () => {
		const result = await runCleanupFailure('json')

		expect(result).toEqual({ stdout: '', stderr: '', verbose: false })
	})

	test('suppresses cleanup diagnostics in quiet mode', async () => {
		const result = await runCleanupFailure('quiet')

		expect(result).toEqual({ stdout: '', stderr: '', verbose: false })
	})

	test('cleans the temporary directory exactly once when cloning fails', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		let cleanupCalls = 0
		fileSystem.remove = async () => {
			cleanupCalls++
			await rm(templateDirectory, { recursive: true, force: true })
		}
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				throw new Error('remote-secret\u001b[2J')
			},
		}))

		await expect(installer.installTemplate('owner/repository', join(root, 'workspace'))).rejects.toThrow(
			'Failed to clone template from repository',
		)

		expect(cleanupCalls).toBe(1)
		expect(await fileSystem.pathExists(templateDirectory)).toBe(false)
	})

	test('cleans the temporary directory exactly once when copying fails', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		fileSystem.copy = async () => {
			throw new Error('copy failed')
		}
		let cleanupCalls = 0
		fileSystem.remove = async () => {
			cleanupCalls++
			await rm(templateDirectory, { recursive: true, force: true })
		}
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(join(destination, 'contember.template.yaml'), '{}')
			},
		}))

		await expect(installer.installTemplate('owner/repository', join(root, 'workspace'))).rejects.toThrow('copy failed')

		expect(cleanupCalls).toBe(1)
		expect(await fileSystem.pathExists(templateDirectory)).toBe(false)
	})
})

const traversalCases = [
	{
		name: 'remove',
		field: 'remove',
		configuration: 'remove:\n  - ../outside.txt\n',
	},
	{
		name: 'rename source',
		field: 'rename source',
		configuration: 'rename:\n  ../outside.txt: renamed.txt\n',
	},
	{
		name: 'rename target',
		field: 'rename target',
		configuration: 'rename:\n  source.txt: ../outside.txt\n',
	},
	{
		name: 'copy source',
		field: 'copy source',
		configuration: 'copy:\n  ../outside.txt: copied.txt\n',
	},
	{
		name: 'copy target',
		field: 'copy target',
		configuration: 'copy:\n  source.txt: ../outside.txt\n',
	},
	{
		name: 'replaceVariables',
		field: 'replaceVariables',
		configuration: 'replaceVariables:\n  - ../outside.txt\n',
	},
]

describe('TemplateInstaller path safety', () => {
	for (const scenario of traversalCases) {
		test(`rejects traversal in ${scenario.name} before copying`, async () => {
			const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
			testDirectories.push(root)
			const templateDirectory = join(root, 'template')
			const targetDirectory = join(root, 'workspace')
			const outsidePath = join(root, 'outside.txt')
			await writeFile(outsidePath, 'sentinel')
			const fileSystem = new FileSystem()
			fileSystem.createTempDir = async () => templateDirectory
			const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
				clone: async destination => {
					await mkdir(destination, { recursive: true })
					await writeFile(join(destination, 'contember.template.yaml'), scenario.configuration)
					await writeFile(join(destination, 'source.txt'), 'source')
				},
			}))

			const installation = installer.installTemplate('owner/repository', targetDirectory)
			await expect(installation).rejects.toBeInstanceOf(InvalidTemplatePathError)
			await expect(installation).rejects.toThrow(`Unsafe path in template configuration: ${scenario.field}.`)

			expect(await readFile(outsidePath, 'utf8')).toBe('sentinel')
			expect(await fileSystem.pathExists(targetDirectory)).toBe(false)
		})
	}

	test('rejects an absolute path before copying', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const targetDirectory = join(root, 'workspace')
		const outsidePath = join(root, 'outside.txt')
		await writeFile(outsidePath, 'sentinel')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(
					join(destination, 'contember.template.yaml'),
					`replaceVariables:\n  - ${outsidePath}\n`,
				)
			},
		}))

		const installation = installer.installTemplate('owner/repository', targetDirectory)
		await expect(installation).rejects.toBeInstanceOf(InvalidTemplatePathError)
		await expect(installation).rejects.toThrow('Unsafe path in template configuration: replaceVariables.')

		expect(await readFile(outsidePath, 'utf8')).toBe('sentinel')
		expect(await fileSystem.pathExists(targetDirectory)).toBe(false)
	})

	test('rejects a copied symlink before replacing variables', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const targetDirectory = join(root, 'workspace')
		const outsidePath = join(root, 'outside.txt')
		await writeFile(outsidePath, 'sentinel {secret}')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(join(destination, 'contember.template.yaml'), 'replaceVariables:\n  - linked.txt\n')
				await symlink(outsidePath, join(destination, 'linked.txt'))
			},
		}))

		const installation = installer.installTemplate('owner/repository', targetDirectory, { secret: 'changed' })
		await expect(installation).rejects.toBeInstanceOf(InvalidTemplatePathError)
		await expect(installation).rejects.toThrow('Unsafe path in template configuration: replaceVariables.')

		expect(await readFile(outsidePath, 'utf8')).toBe('sentinel {secret}')
	})

	test('rejects a symlink in a destination parent before renaming', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const targetDirectory = join(root, 'workspace')
		const outsideDirectory = join(root, 'outside')
		const outsidePath = join(outsideDirectory, 'sentinel.txt')
		await mkdir(outsideDirectory)
		await writeFile(outsidePath, 'sentinel')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(
					join(destination, 'contember.template.yaml'),
					'rename:\n  source.txt: linked/sentinel.txt\n',
				)
				await writeFile(join(destination, 'source.txt'), 'changed')
				await symlink(outsideDirectory, join(destination, 'linked'))
			},
		}))

		const installation = installer.installTemplate('owner/repository', targetDirectory)
		await expect(installation).rejects.toBeInstanceOf(InvalidTemplatePathError)
		await expect(installation).rejects.toThrow('Unsafe path in template configuration: rename target.')

		expect(await readFile(outsidePath, 'utf8')).toBe('sentinel')
	})

	test('normalizes a remove path through a regular file', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		const hostilePath = 'regular.txt/hostile-remove'
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(join(destination, 'contember.template.yaml'), `remove:\n  - ${hostilePath}\n`)
				await writeFile(join(destination, 'regular.txt'), 'regular file')
			},
		}))

		await expectSafePathError(
			installer.installTemplate('owner/repository', join(root, 'workspace')),
			'remove',
			hostilePath,
			root,
		)
	})

	test('normalizes a replace path through a regular file', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		const hostilePath = 'regular.txt/hostile-replace'
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(join(destination, 'contember.template.yaml'), `replaceVariables:\n  - ${hostilePath}\n`)
				await writeFile(join(destination, 'regular.txt'), 'regular file')
			},
		}))

		await expectSafePathError(
			installer.installTemplate('owner/repository', join(root, 'workspace')),
			'replaceVariables',
			hostilePath,
			root,
		)
	})

	test('normalizes rename failure when the target parent is missing', async () => {
		const root = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		testDirectories.push(root)
		const templateDirectory = join(root, 'template')
		const fileSystem = new FileSystem()
		fileSystem.createTempDir = async () => templateDirectory
		const hostilePath = 'hostile-parent/renamed.txt'
		const installer = new TemplateInstaller('/unused', fileSystem, undefined, () => ({
			clone: async destination => {
				await mkdir(destination, { recursive: true })
				await writeFile(
					join(destination, 'contember.template.yaml'),
					`rename:\n  source.txt: ${hostilePath}\n`,
				)
				await writeFile(join(destination, 'source.txt'), 'source')
			},
		}))

		await expectSafePathError(
			installer.installTemplate('owner/repository', join(root, 'workspace')),
			'rename target',
			hostilePath,
			root,
		)
	})
})
