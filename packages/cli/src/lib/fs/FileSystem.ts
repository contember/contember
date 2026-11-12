import * as fs from 'node:fs/promises'
import { access, glob, stat } from 'node:fs/promises'
import { join, posix, sep } from 'node:path'

export class FileSystem {
	readDir = fs.readdir
	readFile = fs.readFile
	pathExists = async (path: string) => {
		try {
			await access(path)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Directories under `dir` matching the workspace globs, relative and `/`-separated.
	 * A `!pattern` excludes matches; the glob base itself (`packages` for `packages/**`) is never returned.
	 */
	listDirectories = async (dir: string, patterns: string[]): Promise<string[]> => {
		const include = patterns.filter(it => !it.startsWith('!')).map(it => posix.normalize(it))
		const exclude = patterns.filter(it => it.startsWith('!')).map(it => posix.normalize(it.slice(1)))
		if (include.length === 0) {
			return []
		}
		const literals = new Set(include.filter(it => !globCharacters.test(it)))
		const bases = new Set(include.filter(it => globCharacters.test(it)).map(getGlobBase).filter(it => !literals.has(it)))
		const result = new Set<string>()
		for await (const entry of glob(include, { cwd: dir, exclude })) {
			const path = entry.split(sep).join('/').replace(/^\.\//, '')
			if (bases.has(path) || result.has(path)) {
				continue
			}
			const stats = await stat(join(dir, path)).catch(() => null)
			if (stats?.isDirectory()) {
				result.add(path)
			}
		}
		return [...result]
	}
}

const globCharacters = /[*?[\]{}()!+@]/

const getGlobBase = (pattern: string): string => {
	const segments = pattern.split('/')
	const firstGlob = segments.findIndex(it => globCharacters.test(it))
	return (firstGlob === -1 ? segments : segments.slice(0, firstGlob)).join('/')
}
