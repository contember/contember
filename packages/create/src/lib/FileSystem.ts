import * as fs from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { copy } from 'fs-extra'
import { tmpdir } from 'node:os'

export class FileSystem {
	readFile = fs.readFile
	writeFile = fs.writeFile
	rename = fs.rename
	readDir = fs.readdir
	copy = copy
	unlink = fs.unlink
	pathExists = async (path: string) => {
		try {
			await access(path)
			return true
		} catch {
			return false
		}
	}
	createTempDir = async () => {
		return await fs.mkdtemp(tmpdir())
	}
}
