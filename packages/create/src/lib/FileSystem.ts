import * as fs from 'node:fs/promises'
import { access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export class FileSystem {
	readFile = fs.readFile
	writeFile = fs.writeFile
	rename = fs.rename
	readDir = fs.readdir
	copy = (source: string, destination: string, options?: { filter?: (source: string, destination: string) => boolean }) =>
		// verbatimSymlinks: by default fs.cp rewrites relative links into absolute paths into the source tree
		fs.cp(source, destination, { recursive: true, verbatimSymlinks: true, ...options })
	unlink = fs.unlink
	remove = fs.rm
	pathExists = async (path: string) => {
		try {
			await access(path)
			return true
		} catch {
			return false
		}
	}
	createTempDir = async () => {
		// mkdtemp appends random characters to the prefix, so without a separator it would create `/tmpXXXXXX`
		return await fs.mkdtemp(join(tmpdir(), 'contember-template-'))
	}
}
