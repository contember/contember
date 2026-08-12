import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Output, OutputMode, OutputStream } from '@contember/cli-common'
import { FileSystem } from '../../../src/lib/FileSystem.js'
import { TemplateInstaller } from '../../../src/lib/TemplateInstaller.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(path => rm(path, { recursive: true, force: true })))
})

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

class CleanupFileSystem extends FileSystem {
	public temporaryDirectory: string | undefined
	public cleanupAttempts = 0
	public cleanupCompleted = false

	public constructor(private readonly failCleanup: boolean) {
		super()
	}

	public override createTempDir = async (): Promise<string> => {
		this.temporaryDirectory = await mkdtemp(join(tmpdir(), 'contember-template-installer-'))
		temporaryDirectories.push(this.temporaryDirectory)
		return this.temporaryDirectory
	}

	public override remove: FileSystem['remove'] = async (path, options) => {
		this.cleanupAttempts++
		if (this.failCleanup) {
			throw new Error('cleanup secret')
		}
		await rm(path, options)
		await Promise.resolve()
		this.cleanupCompleted = true
	}
}

const createOutput = (mode: OutputMode = 'human') => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream()
	const output = new Output({ stdout, stderr })
	output.setMode(mode)
	return { output, stdout, stderr }
}

const createTarget = async (): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), 'contember-template-target-'))
	temporaryDirectories.push(root)
	return join(root, 'project')
}

const writeValidTemplate = async (directory: string): Promise<void> => {
	await writeFile(join(directory, 'contember.template.yaml'), '{}')
	await writeFile(join(directory, 'README.md'), 'template')
}

describe('TemplateInstaller remote cleanup', () => {
	test('awaits cleanup after a successful remote installation', async () => {
		const fileSystem = new CleanupFileSystem(false)
		const { output, stderr } = createOutput()
		const installer = new TemplateInstaller('/unused', fileSystem, output, async (_source, directory) => {
			await writeValidTemplate(directory)
		})

		await installer.installTemplate('owner/repository', await createTarget())

		expect(fileSystem.cleanupAttempts).toBe(1)
		expect(fileSystem.cleanupCompleted).toBe(true)
		expect(await fileSystem.pathExists(fileSystem.temporaryDirectory ?? '')).toBe(false)
		expect(stderr.text).toBe('')
	})

	test('preserves the primary failure when cleanup also fails', async () => {
		const fileSystem = new CleanupFileSystem(true)
		const { output, stderr } = createOutput()
		const installer = new TemplateInstaller('/unused', fileSystem, output, async () => {
			throw new Error('primary clone failure')
		})

		await expect(installer.installTemplate('owner/repository', await createTarget())).rejects.toThrow('primary clone failure')

		expect(fileSystem.cleanupAttempts).toBe(1)
		expect(stderr.text).toContain('Failed to clean up the temporary template directory.')
		expect(stderr.text).not.toContain('cleanup secret')
		expect(stderr.text).not.toContain('owner/repository')
	})

	test('preserves a template validation failure when cleanup also fails', async () => {
		const fileSystem = new CleanupFileSystem(true)
		const { output, stderr } = createOutput()
		const installer = new TemplateInstaller('/unused', fileSystem, output, async () => {})

		await expect(installer.installTemplate('owner/repository', await createTarget())).rejects.toThrow('is not a Contember template')

		expect(fileSystem.cleanupAttempts).toBe(1)
		expect(stderr.text).toContain('Failed to clean up the temporary template directory.')
		expect(stderr.text).not.toContain('cleanup secret')
	})

	for (const mode of ['json', 'quiet'] satisfies OutputMode[]) {
		test(`suppresses cleanup warnings in ${mode} mode`, async () => {
			const fileSystem = new CleanupFileSystem(true)
			const { output, stdout, stderr } = createOutput(mode)
			const installer = new TemplateInstaller('/unused', fileSystem, output, async (_source, directory) => {
				await writeValidTemplate(directory)
			})

			await installer.installTemplate('owner/repository', await createTarget())

			expect(fileSystem.cleanupAttempts).toBe(1)
			expect(stdout.text).toBe('')
			expect(stderr.text).toBe('')
		})
	}

	test('does not clone or clean up local templates', async () => {
		const resourceDirectory = await mkdtemp(join(tmpdir(), 'contember-template-resources-'))
		temporaryDirectories.push(resourceDirectory)
		const templateDirectory = join(resourceDirectory, 'templates/default')
		await mkdir(templateDirectory, { recursive: true })
		await writeValidTemplate(templateDirectory)
		const fileSystem = new CleanupFileSystem(false)
		const { output } = createOutput()
		let cloneCalled = false
		const installer = new TemplateInstaller(resourceDirectory, fileSystem, output, async () => {
			cloneCalled = true
		})

		await installer.installTemplate('default', await createTarget())

		expect(cloneCalled).toBe(false)
		expect(fileSystem.cleanupAttempts).toBe(0)
	})
})
