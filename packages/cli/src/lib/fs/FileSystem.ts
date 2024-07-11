import * as fs from 'node:fs/promises'
import { access } from 'node:fs/promises'
import glob from 'fast-glob'

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
	listDirectories = async (dir: string, patterns: string[]): Promise<string[]> => {
		return await glob(patterns, { onlyDirectories: true, cwd: dir })
	}
}
