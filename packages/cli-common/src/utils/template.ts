import { isAbsolute, join } from 'path'
import { replaceFileContent } from './fs'
import { copy, pathExists, remove, rename } from 'fs-extra'
import { downloadPackage } from './npm'
import { resourcesDir } from '../pathUtils'
import { readYaml } from './yaml'

const localTemplates: Record<string, string> = {
	['@contember/template-workspace']: join(resourcesDir, 'templates/template-workspace'),
	['@contember/template-project']: join(resourcesDir, 'templates/template-project'),
}
export const installTemplate = async (
	template: string,
	targetDir: string,
	requiredTemplateType: string,
	variables: Record<string, string> = {},
) => {
	let removeTemplate = () => {}
	if (localTemplates[template]) {
		template = localTemplates[template]
	}
	if (!isAbsolute(template)) {
		template = await downloadPackage(template)
		removeTemplate = async () => {
			await remove(template)
		}
	}
	const templateConfigFile = join(template, 'contember.template.yaml')
	if (!(await pathExists(templateConfigFile))) {
		throw `${template} is not a Contember template`
	}
	const config = (await readYaml(templateConfigFile)) as {
		type?: string
		remove?: string[]
		patchPackageJson?: boolean
		rename?: Record<string, string>
		copy?: Record<string, string>
		replaceVariables?: string[]
	}
	const nodeModulesDir = join(template, 'node_modules')
	const skippedFiles = new Set([...(config.remove || []).map(it => join(template, it)), templateConfigFile])
	await copy(template, targetDir, {
		filter: src => !src.startsWith(nodeModulesDir) && !skippedFiles.has(src),
	})
	await removeTemplate()

	if (config.patchPackageJson) {
		await replaceFileContent(join(targetDir, 'package.json'), content => {
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
		await rename(join(targetDir, source), join(targetDir, target))
	}
	for (const [source, target] of Object.entries(config.copy || {})) {
		await copy(join(targetDir, source), join(targetDir, target))
	}

	for (const file of config.replaceVariables || []) {
		const path = join(targetDir, file)
		if (!(await pathExists(path))) {
			continue
		}
		await replaceFileContent(path, content =>
			Object.entries(variables).reduce(
				(content, [key, value]) => content.replace(new RegExp(`\{${key}\}`, 'g'), value),
				content,
			),
		)
	}
}
