import { join } from 'node:path'
import degit from 'degit'
import jsyaml from 'js-yaml'
import { FileSystem } from './FileSystem.js'

interface TemplateInstallerOutput {
	warn(message: string): void
}

type CloneTemplate = (source: string, target: string) => Promise<void>

const cloneTemplate: CloneTemplate = async (source, target) => {
	const emitter = degit(source, { cache: false, force: true, verbose: true })
	await emitter.clone(target)
}

export class TemplateInstaller {
	private localTemplates: Record<string, string>

	constructor(
		private readonly resourceDir: string,
		private readonly fs: FileSystem,
		private readonly output: TemplateInstallerOutput,
		private readonly clone: CloneTemplate = cloneTemplate,
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
		let temporaryTemplateDir: string | undefined
		let remoteTemplate: string | undefined

		if (this.localTemplates[template]) {
			template = this.localTemplates[template]
		} else {
			remoteTemplate = template
			temporaryTemplateDir = await this.fs.createTempDir()
			template = temporaryTemplateDir
		}

		try {
			if (remoteTemplate !== undefined) {
				try {
					await this.clone(remoteTemplate, template)
				} catch (error) {
					throw new Error(`Failed to clone template from repository: ${error}`)
				}
			}

			const templateConfigFile = join(template, 'contember.template.yaml')
			if (!(await this.fs.pathExists(templateConfigFile))) {
				throw new Error(`${template} is not a Contember template`)
			}
			const config = (await this.readYaml(templateConfigFile)) as {
				type?: string
				remove?: string[]
				patchPackageJson?: boolean
				rename?: Record<string, string>
				copy?: Record<string, string>
				replaceVariables?: string[]
			}
			const nodeModulesDir = join(template, 'node_modules')
			const skippedFiles = new Set([...(config.remove || []).map(it => join(template, it)), templateConfigFile])
			if (await this.fs.pathExists(targetDir)) {
				throw `${targetDir} already exists`
			}
			await this.fs.copy(template, targetDir, {
				filter: src => !src.startsWith(nodeModulesDir) && !skippedFiles.has(src),
			})

			if (config.patchPackageJson) {
				await this.replaceFileContent(join(targetDir, 'package.json'), content => {
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
			}
			for (const [source, target] of Object.entries(config.rename || {})) {
				await this.fs.rename(join(targetDir, source), join(targetDir, target))
			}
			for (const [source, target] of Object.entries(config.copy || {})) {
				await this.fs.copy(join(targetDir, source), join(targetDir, target))
			}

			for (const file of config.replaceVariables || []) {
				const path = join(targetDir, file)
				if (!(await this.fs.pathExists(path))) {
					continue
				}
				await this.replaceFileContent(path, content =>
					Object.entries(variables).reduce(
						(content, [key, value]) => content.replace(new RegExp(`{${key}}`, 'g'), value),
						content,
					))
			}
		} finally {
			if (temporaryTemplateDir !== undefined) {
				await this.cleanupTemporaryTemplate(temporaryTemplateDir)
			}
		}
	}

	private cleanupTemporaryTemplate = async (path: string): Promise<void> => {
		try {
			await this.fs.remove(path, { recursive: true, force: true })
		} catch {
			this.output.warn('Failed to clean up the temporary template directory.')
		}
	}

	private replaceFileContent = async (path: string, replacer: (content: string) => string): Promise<void> => {
		const content = await this.fs.readFile(path, { encoding: 'utf8' })
		const newContent = replacer(content)
		await this.fs.writeFile(path, newContent, { encoding: 'utf8' })
	}

	private readYaml = async <T = unknown>(path: string): Promise<T> => {
		const content = await this.fs.readFile(path, { encoding: 'utf8' })
		return jsyaml.load(content) as unknown as T
	}
}
