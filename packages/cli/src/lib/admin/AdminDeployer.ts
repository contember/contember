import { AdminClient, AdminFiles } from './AdminClient'
import { FileSystem } from '../fs/FileSystem'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider'

export class AdminDeployer {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
		private readonly adminClient: AdminClient,
		private readonly fs: FileSystem,
	) {
	}

	public deploy = async ({ dir, root }: {
		dir: string
		root: boolean
	}) => {
		console.log('Deploying admin...')
		const files = await this.readAdminFiles(dir)
		const project = root ? null : this.remoteProjectProvider.get().name

		// in some cases you need deploy whole folder with custom build etc.
		// with root option you can build app on your own and simply deploy it with subprojects
		await this.adminClient.deploy(project, files)

		console.log(`Admin deployed (${files.length} files)`)
	}


	private readAdminFiles = async (dir: string, prefix: string = ''): Promise<AdminFiles> => {
		const files = []
		for (const fileName of await this.fs.readDir(dir, { withFileTypes: true })) {
			if (fileName.isDirectory()) {
				const subFiles = await this.readAdminFiles(`${dir}/${fileName.name}`, prefix + fileName.name + '/')
				files.push(...subFiles)
			} else if (fileName.isFile()) {
				files.push({
					path: prefix + fileName.name,
					data: (await this.fs.readFile(`${dir}/${fileName.name}`)).toString('base64'),
				})
			}
		}

		return files
	}
}
