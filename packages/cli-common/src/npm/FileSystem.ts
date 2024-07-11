import fs from 'node:fs/promises'

export interface FileSystem {
	readFile: typeof fs.readFile
	pathExists: (path: string) => Promise<boolean>
	listDirectories: (dir: string, patterns: string[]) => Promise<string[]>
}
