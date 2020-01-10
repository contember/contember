import { join } from 'path'
import { replaceFileContent, tryUnlink } from './fs'
import { copy, pathExists, rename, rmdir } from 'fs-extra'
import { getTarball } from './npm'
import * as http from 'http'
import { createGunzip } from 'zlib'
import { extract } from 'tar-fs'
import { Stream } from 'stream'
import { readYaml } from './yaml'

const streamToPromise = async (stream: Stream): Promise<void> => {
	return await new Promise((resolve, reject) => {
		stream.on('end', resolve).on('error', reject)
	})
}

export const installTemplate = async (
	template: string,
	targetDir: string,
	requiredTemplateType: string,
	variables: Record<string, string> = {},
) => {
	if (await pathExists(targetDir)) {
		throw new Error(`${targetDir} already exists`)
	}
	if (template.startsWith('/')) {
		const nodeModulesDir = join(template, 'node_modules')
		await copy(template, targetDir, {
			filter: src => {
				// this is useful for Contember developers
				return !src.startsWith(nodeModulesDir)
			},
		})
	} else {
		const tarBall = await getTarball(template)
		const untarStream = http
			.get(tarBall)
			.pipe(createGunzip())
			.pipe(extract(targetDir))
		await streamToPromise(untarStream)
	}
	const templateConfigFile = join(targetDir, 'contember.template.yaml')
	if (!(await pathExists(templateConfigFile))) {
		await rmdir(targetDir)
		throw new Error(`${template} is not a Contember template`)
	}
	const config = (await readYaml(templateConfigFile)) as {
		type?: string
		remove?: string[]
		patchPackageJson?: boolean
		rename?: Record<string, string>
		replaceVariables?: string[]
	}
	if (!config.type || config.type !== requiredTemplateType) {
		await rmdir(targetDir)
		throw new Error(`${template} is not a ${requiredTemplateType} template`)
	}
	await tryUnlink(templateConfigFile)

	for (const fileToRemove of config.remove || []) {
		await tryUnlink(join(targetDir, fileToRemove))
	}

	if (config.patchPackageJson) {
		await replaceFileContent(join(targetDir, 'package.json'), content => {
			const { name, version, 'scripts-template': scripts, scripts: _nullScripts, ...json } = JSON.parse(content)
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
