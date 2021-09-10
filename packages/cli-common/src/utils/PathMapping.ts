import { basename, join, resolve } from 'path'
import { pathExists } from 'fs-extra'
import { listDirectories } from './fs'

export type PathMapping = Record<string, string>
export const resolvePathMappingConfig = async (
	baseDir: string,
	defaultDir: string,
	config?: PathMapping,
): Promise<PathMapping> => {
	if (config) {
		return Object.fromEntries(Object.entries(config).map(([name, path]) => [name, resolve(baseDir, path)]))
	}
	const dir = join(baseDir, defaultDir)
	if (await pathExists(dir)) {
		return { ['*']: dir }
	} else {
		// single instance/project
		const baseName = process.env.CONTEMBER_PROJECT_NAME ?? basename(baseDir)
			.toLocaleLowerCase()
			.replace(/[^-_a-z0-9]/, '')
		return { [baseName]: baseDir }
	}
}

export const getPathFromMapping = (config: PathMapping, name: string): string => {
	if (config[name]) {
		return config[name]
	} else if (config['*']) {
		return join(config['*'], name)
	} else {
		throw `${name} not found in path mapping`
	}
}

export const listEntriesInMapping = async (config: PathMapping): Promise<string[]> => {
	return (
		await Promise.all(
			Object.entries(config).map(async ([name, path]) => {
				if (name === '*') {
					return (await listDirectories(path)).map(it => basename(it))
				} else {
					return [name]
				}
			}),
		)
	).flatMap(it => it)
}
