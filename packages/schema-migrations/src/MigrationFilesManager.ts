import { MigrationVersionHelper } from '@contember/engine-common'
import * as fs from 'fs'
import { promisify } from 'util'
import * as path from 'path'

const readFile = promisify(fs.readFile)
const fsWrite = promisify(fs.writeFile)
const fsRemove = promisify(fs.unlink)
const fsRealpath = promisify(fs.realpath)
const mkdir = promisify(fs.mkdir)
const lstatFile = promisify(fs.lstat)
const readDir = promisify(fs.readdir)
const mvFile = promisify(fs.rename)

class MigrationFilesManager {
	constructor(public readonly directory: string) {}

	public async createFile(content: string, name: string): Promise<string> {
		const path = this.formatPath(name)
		await fsWrite(path, content, { encoding: 'utf8' })
		return await fsRealpath(path)
	}

	public async removeFile(name: string) {
		const path = this.formatPath(name)
		await fsRemove(path)
	}

	public async moveFile(oldName: string, newName: string) {
		await mvFile(this.formatPath(oldName), this.formatPath(newName))
	}

	public async createDirIfNotExist(): Promise<void> {
		try {
			await mkdir(this.directory)
		} catch (e) {
			if (!(e instanceof Error) || !('code' in e) || (e as any).code !== 'EEXIST') {
				throw e
			}
		}
	}

	public async listFiles(): Promise<string[]> {
		const files: string[] = await this.tryReadDir()

		const filteredFiles: string[] = await Promise.all(
			files
				.filter(file => file.endsWith(`.json`))
				.filter(async file => {
					return (await lstatFile(`${this.directory}/${file}`)).isFile()
				}),
		)
		return filteredFiles.sort()
	}

	private async tryReadDir(): Promise<string[]> {
		try {
			return await readDir(this.directory)
		} catch (e) {
			if (e instanceof Error && 'code' in e && (e as any).code === 'ENOENT') {
				return []
			}
			throw e
		}
	}

	public async readFiles(predicate?: (version: string) => boolean): Promise<MigrationFilesManager.MigrationFile[]> {
		let files = await this.listFiles()
		if (predicate) {
			files = files.filter(filename => predicate(MigrationVersionHelper.extractVersion(filename)))
		}
		const filesWithContent = files.map(async filename => ({
			filename: filename,
			path: `${this.directory}/${filename}`,
			content: await readFile(`${this.directory}/${filename}`, { encoding: 'utf8' }),
		}))

		return await Promise.all(filesWithContent)
	}

	public static createForProject(projectsDirectory: string, projectSlug: string): MigrationFilesManager {
		const migrationsDir = path.join(projectsDirectory, projectSlug, 'migrations')
		return new MigrationFilesManager(migrationsDir)
	}

	private formatPath(version: string) {
		const filename = `${version}.json`
		const path = `${this.directory}/${filename}`
		return path
	}
}

namespace MigrationFilesManager {
	export type MigrationFile = {
		filename: string
		path: string
		content: string
	}
}

export { MigrationFilesManager }
