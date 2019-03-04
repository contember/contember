import FileNameHelper from './FileNameHelper'
import fs from 'fs'
import { promisify } from 'util'

type EngineMigrationType = 'tenant' | 'project'

const readFile = promisify(fs.readFile)
const fsWrite = promisify(fs.writeFile)
const fsRealpath = promisify(fs.realpath)
const mkdir = promisify(fs.mkdir)
const lstatFile = promisify(fs.lstat)
const readDir = promisify(fs.readdir)

class MigrationFilesManager {
	constructor(public readonly directory: string) {}

	public async createEmptyFile(name: string, extension: string): Promise<string> {
		return await this.createFile('', name, extension)
	}

	public async createFile(content: string, name: string, extension: string): Promise<string> {
		const filename = FileNameHelper.createFileName(name, extension)
		const path = `${this.directory}/${filename}`
		await fsWrite(path, content, { encoding: 'utf8' })
		return await fsRealpath(path)
	}

	public async createDirIfNotExist(): Promise<void> {
		try {
			await mkdir(this.directory)
		} catch (error) {
			if (error.code !== 'EEXIST') {
				throw error
			}
		}
	}

	public async listFiles(extension: string): Promise<string[]> {
		const files: string[] = await readDir(this.directory)

		const filteredFiles: string[] = await Promise.all(
			files.filter(file => file.endsWith(`.${extension}`)).filter(async file => {
				return (await lstatFile(`${this.directory}/${file}`)).isFile()
			})
		)
		return filteredFiles.sort()
	}

	public async readFiles(
		extension: string,
		predicate?: (version: string) => boolean
	): Promise<
		{
			filename: string
			path: string
			version: string
			content: string
		}[]
	> {
		let files = await this.listFiles(extension)
		if (predicate) {
			files = files.filter(filename => predicate(FileNameHelper.extractVersion(filename)))
		}
		const filesWithContent = files.map(async filename => ({
			filename: filename,
			path: `${this.directory}/${filename}`,
			version: FileNameHelper.extractVersion(filename),
			content: await readFile(`${this.directory}/${filename}`, { encoding: 'utf8' }),
		}))

		return await Promise.all(filesWithContent)
	}

	public static createForEngine(type: EngineMigrationType): MigrationFilesManager {
		return new MigrationFilesManager(`${__dirname}/../../../migrations/${type}`)
	}

	public static createForProject(projectsDirectory: string, projectName: string): MigrationFilesManager {
		return new MigrationFilesManager(`${projectsDirectory}/${projectName}/migrations`)
	}
}

export default MigrationFilesManager
