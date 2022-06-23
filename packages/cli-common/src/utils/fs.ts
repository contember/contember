import { tuple } from './tuple'
import { readdir, lstat, access, readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'

export const pathExists = async (path: string): Promise<boolean> => {
	try {
		await access(path)
		return true
	} catch (e: any) {
		if (e.code && e.code === 'ENOENT') {
			return false
		}
		throw e
	}
}

export const listDirectories = async (dir: string): Promise<string[]> => {
	try {
		const entries = (await readdir(dir)).map(it => join(dir, it))
		const stats = await Promise.all(entries.map(async it => tuple(it, await lstat(it))))
		return stats.filter(([, it]) => it.isDirectory()).map(([it]) => it)
	} catch (e) {
		if (e instanceof Error && 'code' in e && (e as any).code === 'ENOENT') {
			return []
		}
		throw e
	}
}

export const replaceFileContent = async (path: string, replacer: (content: string) => string): Promise<void> => {
	const content = await readFile(path, { encoding: 'utf8' })
	const newContent = replacer(content)
	await writeFile(path, newContent, { encoding: 'utf8' })
}

export const tryUnlink = async (path: string): Promise<void> => {
	try {
		await unlink(path)
	} catch (e) {
		if (e instanceof Error && 'code' in e && (e as any).code === 'ENOENT') {
			return
		}
		throw e
	}
}
