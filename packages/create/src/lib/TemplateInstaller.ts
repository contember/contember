import { isAbsolute, join, relative, resolve, sep, win32 } from 'node:path'
import { FileSystem } from './FileSystem.js'
import jsyaml from 'js-yaml'
import degit from 'degit'
import { InvalidInputError, type Output } from '@contember/cli-common'

type TemplateCloneFactory = (
	source: string,
	options: { cache: boolean; force: boolean; verbose: boolean },
) => { clone(destination: string): Promise<void> }

type TemplateConfig = {
	type?: string
	remove?: string[]
	patchPackageJson?: boolean
	rename?: Record<string, string>
	copy?: Record<string, string>
	replaceVariables?: string[]
}

export class InvalidTemplatePathError extends InvalidInputError {
	constructor(field: string) {
		super(`Unsafe path in template configuration: ${field}.`)
		this.name = 'InvalidTemplatePathError'
	}
}

export class TemplateInstaller {
	private localTemplates: Record<string, string>

	constructor(
		private readonly resourceDir: string,
		private readonly fs: FileSystem,
		private readonly output?: Pick<Output, 'warn'>,
		private readonly cloneTemplate: TemplateCloneFactory = degit,
	) {
		this.localTemplates = {
			['default']: join(this.resourceDir, 'templates/default'),
		}
	}

	installTemplate = async (
		template: string,
		targetDir: string,
		variables: Record<string, string> = {},
	) => {
		let config: TemplateConfig

		if (this.localTemplates[template]) {
			template = this.localTemplates[template]
			config = await this.copyTemplate(template, targetDir)
		} else {
			const tmpDir = await this.fs.createTempDir()
			let cleanupStarted = false
			const removeTemplate = async () => {
				if (cleanupStarted) {
					return
				}
				cleanupStarted = true
				try {
					await this.fs.remove(tmpDir, { recursive: true, force: true })
				} catch {
					this.output?.warn('Failed to clean up temporary template')
				}
			}

			try {
				try {
					const emitter = this.cloneTemplate(template, { cache: false, force: true, verbose: false })
					await emitter.clone(tmpDir)
				} catch {
					throw new Error('Failed to clone template from repository')
				}
				template = tmpDir
				config = await this.copyTemplate(template, targetDir)
			} finally {
				await removeTemplate()
			}
		}

		await this.validatePostCopyPaths(config, targetDir)

		if (config.patchPackageJson) {
			const packageJsonPath = this.resolveConfigPath(targetDir, 'package.json', 'package.json')
			await this.assertSafePath(targetDir, packageJsonPath, 'package.json', true)
			await this.runConfiguredOperation('package.json', async () => {
				await this.replaceFileContent(packageJsonPath, content => {
					const {
						name,
						version,
						'scripts-template': scripts,
						scripts: _nullScripts,
						license,
						...json
					} = JSON.parse(content)
					return JSON.stringify({ scripts, ...json }, null, '  ')
				})
			})
		}
		for (const [source, target] of Object.entries(config.rename || {})) {
			const sourcePath = this.resolveConfigPath(targetDir, source, 'rename source')
			const targetPath = this.resolveConfigPath(targetDir, target, 'rename target')
			await this.assertSafePath(targetDir, sourcePath, 'rename source', true)
			await this.assertSafePath(targetDir, targetPath, 'rename target', false)
			await this.runConfiguredOperation('rename target', async () => {
				await this.fs.rename(sourcePath, targetPath)
			})
		}
		for (const [source, target] of Object.entries(config.copy || {})) {
			const sourcePath = this.resolveConfigPath(targetDir, source, 'copy source')
			const targetPath = this.resolveConfigPath(targetDir, target, 'copy target')
			await this.assertSafePath(targetDir, sourcePath, 'copy source', true)
			await this.assertSafePath(targetDir, targetPath, 'copy target', false)
			await this.runConfiguredOperation('copy target', async () => {
				await this.fs.copy(sourcePath, targetPath)
			})
		}

		for (const file of config.replaceVariables || []) {
			const path = this.resolveConfigPath(targetDir, file, 'replaceVariables')
			await this.assertSafePath(targetDir, path, 'replaceVariables', false)
			if (!(await this.fs.pathExists(path))) {
				continue
			}
			await this.assertSafePath(targetDir, path, 'replaceVariables', true)
			await this.runConfiguredOperation('replaceVariables', async () => {
				await this.replaceFileContent(path, content =>
					Object.entries(variables).reduce(
						(content, [key, value]) => content.replace(new RegExp(`{${key}}`, 'g'), value),
						content,
					))
			})
		}
	}

	private copyTemplate = async (template: string, targetDir: string): Promise<TemplateConfig> => {
		template = resolve(template)
		const templateConfigFile = join(template, 'contember.template.yaml')
		if (!(await this.fs.pathExists(templateConfigFile))) {
			throw new Error(`${template} is not a Contember template`)
		}
		await this.assertSafePath(template, templateConfigFile, 'configuration file', true)
		const config = await this.readYaml(templateConfigFile)
		if (!isTemplateConfig(config)) {
			throw new InvalidInputError('Invalid Contember template configuration.')
		}
		this.validateConfigPaths(config)
		const nodeModulesDir = resolve(template, 'node_modules')
		const skippedFiles = new Set<string>([templateConfigFile])
		for (const path of config.remove || []) {
			const resolvedPath = this.resolveConfigPath(template, path, 'remove')
			await this.assertSafePath(template, resolvedPath, 'remove', false)
			skippedFiles.add(resolvedPath)
		}
		if (await this.fs.pathExists(targetDir)) {
			throw `${targetDir} already exists`
		}
		await this.fs.copy(template, targetDir, {
			filter: src => src !== nodeModulesDir && !src.startsWith(`${nodeModulesDir}${sep}`) && !skippedFiles.has(src),
		})
		return config
	}

	private validateConfigPaths = (config: TemplateConfig): void => {
		for (const path of config.remove || []) {
			this.assertRelativeConfigPath(path, 'remove')
		}
		for (const [source, target] of Object.entries(config.rename || {})) {
			this.assertRelativeConfigPath(source, 'rename source')
			this.assertRelativeConfigPath(target, 'rename target')
		}
		for (const [source, target] of Object.entries(config.copy || {})) {
			this.assertRelativeConfigPath(source, 'copy source')
			this.assertRelativeConfigPath(target, 'copy target')
		}
		for (const path of config.replaceVariables || []) {
			this.assertRelativeConfigPath(path, 'replaceVariables')
		}
	}

	private validatePostCopyPaths = async (config: TemplateConfig, targetDir: string): Promise<void> => {
		if (config.patchPackageJson) {
			const path = this.resolveConfigPath(targetDir, 'package.json', 'package.json')
			await this.assertSafePath(targetDir, path, 'package.json', false)
		}
		for (const [source, target] of Object.entries(config.rename || {})) {
			await this.assertSafePath(
				targetDir,
				this.resolveConfigPath(targetDir, source, 'rename source'),
				'rename source',
				false,
			)
			await this.assertSafePath(
				targetDir,
				this.resolveConfigPath(targetDir, target, 'rename target'),
				'rename target',
				false,
			)
		}
		for (const [source, target] of Object.entries(config.copy || {})) {
			await this.assertSafePath(
				targetDir,
				this.resolveConfigPath(targetDir, source, 'copy source'),
				'copy source',
				false,
			)
			await this.assertSafePath(
				targetDir,
				this.resolveConfigPath(targetDir, target, 'copy target'),
				'copy target',
				false,
			)
		}
		for (const file of config.replaceVariables || []) {
			await this.assertSafePath(
				targetDir,
				this.resolveConfigPath(targetDir, file, 'replaceVariables'),
				'replaceVariables',
				false,
			)
		}
	}

	private resolveConfigPath = (root: string, path: string, field: string): string => {
		this.assertRelativeConfigPath(path, field)
		return resolve(root, path)
	}

	private assertRelativeConfigPath = (path: string, field: string): void => {
		const segments = path.split(/[\\/]/)
		if (
			path.length === 0
			|| isAbsolute(path)
			|| win32.isAbsolute(path)
			|| segments.some(segment => segment === '..')
			|| segments.every(segment => segment.length === 0 || segment === '.')
		) {
			throw new InvalidTemplatePathError(field)
		}
	}

	private assertSafePath = async (
		root: string,
		path: string,
		field: string,
		mustExist: boolean,
	): Promise<void> => {
		const absoluteRoot = resolve(root)
		try {
			const rootStats = await this.fs.lstat(absoluteRoot)
			if (rootStats.isSymbolicLink()) {
				throw new InvalidTemplatePathError(field)
			}
		} catch (error) {
			if (error instanceof InvalidTemplatePathError) {
				throw error
			}
			throw new InvalidTemplatePathError(field)
		}
		const relativePath = relative(absoluteRoot, path)
		if (relativePath.length === 0 || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
			throw new InvalidTemplatePathError(field)
		}

		let currentPath = absoluteRoot
		for (const segment of relativePath.split(sep)) {
			currentPath = join(currentPath, segment)
			try {
				const stats = await this.fs.lstat(currentPath)
				if (stats.isSymbolicLink()) {
					throw new InvalidTemplatePathError(field)
				}
			} catch (error) {
				if (error instanceof InvalidTemplatePathError) {
					throw error
				}
				if (isNotFoundError(error)) {
					if (mustExist) {
						throw new InvalidTemplatePathError(field)
					}
					return
				}
				throw new InvalidTemplatePathError(field)
			}
		}

		let realRoot: string
		let realPath: string
		try {
			realRoot = await this.fs.realPath(absoluteRoot)
			realPath = await this.fs.realPath(path)
		} catch {
			throw new InvalidTemplatePathError(field)
		}
		const realRelativePath = relative(realRoot, realPath)
		if (
			realRelativePath.length === 0
			|| realRelativePath === '..'
			|| realRelativePath.startsWith(`..${sep}`)
			|| isAbsolute(realRelativePath)
		) {
			throw new InvalidTemplatePathError(field)
		}
	}

	private runConfiguredOperation = async (field: string, operation: () => Promise<void>): Promise<void> => {
		try {
			await operation()
		} catch (error) {
			if (error instanceof InvalidTemplatePathError) {
				throw error
			}
			throw new InvalidTemplatePathError(field)
		}
	}

	private replaceFileContent = async (path: string, replacer: (content: string) => string): Promise<void> => {
		const content = await this.fs.readFile(path, { encoding: 'utf8' })
		const newContent = replacer(content)
		await this.fs.writeFile(path, newContent, { encoding: 'utf8' })
	}

	private readYaml = async (path: string): Promise<unknown> => {
		const content = await this.fs.readFile(path, { encoding: 'utf8' })
		return jsyaml.load(content)
	}
}

const isTemplateConfig = (value: unknown): value is TemplateConfig => {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false
	}
	return (!('type' in value) || typeof value.type === 'string')
		&& (!('remove' in value) || isStringArray(value.remove))
		&& (!('patchPackageJson' in value) || typeof value.patchPackageJson === 'boolean')
		&& (!('rename' in value) || isStringRecord(value.rename))
		&& (!('copy' in value) || isStringRecord(value.copy))
		&& (!('replaceVariables' in value) || isStringArray(value.replaceVariables))
}

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')

const isStringRecord = (value: unknown): value is Record<string, string> =>
	typeof value === 'object'
	&& value !== null
	&& !Array.isArray(value)
	&& Object.values(value).every(item => typeof item === 'string')

const isNotFoundError = (error: unknown): boolean => typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
