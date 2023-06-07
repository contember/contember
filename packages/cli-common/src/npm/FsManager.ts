import jsyaml from 'js-yaml'
import fs from 'node:fs/promises'
import glob from 'fast-glob'
import { pathExists } from '../utils'

export class FsManager {
	constructor() {
	}

	public async exists(filename: string): Promise<boolean> {
		return await pathExists(filename)
	}

	public async tryReadJson<T = any>(filename: string): Promise<T | null> {
		const content = await this.tryReadFile(filename)
		return content !== null ? JSON.parse(content) : null
	}

	public async tryReadYaml<T = any>(filename: string): Promise<T | null> {
		const content = await this.tryReadFile(filename)
		return content !== null ? jsyaml.load(content) as T : null
	}

	public async tryReadFile(filename: string): Promise<string | null> {
		try {
			return await fs.readFile(filename, 'utf8')
		} catch (error: any) {
			if (error.code === 'ENOENT') {
				return null
			}
			throw error
		}
	}

	public async listDirectories(dir: string, patterns: string[]): Promise<string[]> {
		return await glob(patterns, { onlyDirectories: true, cwd: dir })
	}
}
