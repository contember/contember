import { basename, join, resolve } from 'path'
import { listDirectories } from './fs'

export type PathMapping = Record<string, string>
export const resolvePathMappingConfig = async (
	baseDir: string,
	defaultProjectName: string,
	config?: PathMapping,
): Promise<PathMapping> => {
	if (config) {
		return Object.fromEntries(Object.entries(config).map(([name, path]) => [name, resolve(baseDir, path)]))
	}
	// single instance/project
	return { [defaultProjectName]: baseDir }
}

export const getPathFromMapping = (config: PathMapping, name: string): string | undefined => {
	if (config[name]) {
		return config[name]
	} else if (config['*']) {
		return join(config['*'], name)
	}
	return undefined
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
