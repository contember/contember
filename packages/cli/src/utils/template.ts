import { join, isAbsolute } from 'path'
import { replaceFileContent, tryUnlink } from './fs'
import { copy, pathExists, remove, rename } from 'fs-extra'
import { readYaml } from './yaml'
import { downloadPackage } from './npm'

export const installTemplate = async (
	template: string,
	targetDir: string,
	requiredTemplateType: string,
	variables: Record<string, string> = {},
) => {
	if (isAbsolute(template)) {
		const nodeModulesDir = join(template, 'node_modules')
		await copy(template, targetDir, {
			filter: src => {
				// this is useful for Contember developers
				return !src.startsWith(nodeModulesDir)
			},
		})
	} else {
		await downloadPackage(template, targetDir)
	}
	const templateConfigFile = join(targetDir, 'contember.template.yaml')
	if (!(await pathExists(templateConfigFile))) {
		await remove(targetDir)
		throw `${template} is not a Contember template`
	}
	const config = (await readYaml(templateConfigFile)) as {
		type?: string
		remove?: string[]
		patchPackageJson?: boolean
		rename?: Record<string, string>
		replaceVariables?: string[]
	}
	if (!config.type || config.type !== requiredTemplateType) {
		await remove(targetDir)
		throw `${template} is not a ${requiredTemplateType} template`
	}
	await tryUnlink(templateConfigFile)

	for (const fileToRemove of config.remove || []) {
		await tryUnlink(join(targetDir, fileToRemove))
	}

	if (config.patchPackageJson) {
		await replaceFileContent(join(targetDir, 'package.json'), content => {
			const { name, version, 'scripts-template': scripts, scripts: _nullScripts, license, ...json } = JSON.parse(
				content,
			)
			return JSON.stringify({ scripts, ...json }, null, '  ')
		})
	}
	for (const [source, target] of Object.entries(config.rename || {})) {
		await rename(join(targetDir, source), join(targetDir, target))
	}

	for (const file of config.replaceVariables || []) {
		const path = join(targetDir, file)
		if (!(await pathExists(path))) {
			continue
		}
		await replaceFileContent(path, content =>
			Object.entries(variables).reduce((content, [key, value]) => content.replace(`{${key}}`, value), content),
		)
	}
}
