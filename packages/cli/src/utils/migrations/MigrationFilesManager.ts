import { MigrationVersionHelper } from '@contember/engine-common'
import * as fs from 'node:fs/promises'
import { MigrationFileLoader } from './MigrationFileLoader'
import { MigrationContent, MigrationFile } from './MigrationFile'
import { join } from 'node:path'
import { Dirent } from 'node:fs'

export class MigrationFilesManager {
	private migrations: null | Promise<MigrationFile[]> = null

	constructor(
		public readonly directory: string,
		private readonly loaders: Record<string, MigrationFileLoader>,
	) {}

	public async createFile(content: string, name: string): Promise<string> {
		this.migrations = null
		const path = this.formatPath(name)
		await fs.writeFile(path, content, { encoding: 'utf8' })
		return await fs.realpath(path)
	}

	public async removeFile(name: string) {
		this.migrations = null
		const path = this.formatPath(name)
		await fs.unlink(path)
	}

	public async moveFile(oldName: string, newName: string) {
		this.migrations = null
		await fs.rename(this.formatPath(oldName), this.formatPath(newName))
	}

	public async createDirIfNotExist(): Promise<void> {
		try {
			await fs.mkdir(this.directory)
		} catch (e) {
			if (!(e instanceof Error) || !('code' in e) || (e as any).code !== 'EEXIST') {
				throw e
			}
		}
	}

	public async readFiles(): Promise<MigrationFile[]> {
		return this.migrations ??= this.forceReadFiles()
	}

	public async forceReadFiles(): Promise<MigrationFile[]> {
		const files = (await this.listFiles()).map(it => ({
			filename: it,
			version: MigrationVersionHelper.extractVersion(it),
		}))

		return files.map(({ version, filename }): MigrationFile => {
			const ext = filename.substring(filename.lastIndexOf('.') + 1)
			const path = join(this.directory, filename)
			let content: Promise<MigrationContent> | null = null
			const file: MigrationFile = {
				path: path,
				version: version,
				name: MigrationVersionHelper.extractName(path.substring(path.lastIndexOf('/') + 1)),
				getContent: () => {
					content ??= this.loaders[ext].load(file)
					return content
				},
			}
			return file
		})
	}

	private async tryReadDir(): Promise<Dirent[]> {
		try {
			return await fs.readdir(this.directory, { withFileTypes: true })
		} catch (e) {
			if (e instanceof Error && 'code' in e && (e as any).code === 'ENOENT') {
				return []
			}
			throw e
		}
	}

	private async listFiles(): Promise<string[]> {
		const files = await this.tryReadDir()

		const extensions = Object.keys(this.loaders).join('|')
		const regex = new RegExp('^\\d{4}-\\d{2}-\\d{2}-\\d{6}-[\\w-]+\\.(' + extensions  + ')$')
		const filteredFiles = await Promise.all(
			files
				.filter(it => it.isFile())
				.map(it => it.name)
				.filter(it => it.match(regex)),
		)

		return filteredFiles.sort()
	}

	private formatPath(version: string) {
		const filename = `${version}.json`
		const path = `${this.directory}/${filename}`
		return path
	}
}
