import { AdminClient, AdminFiles } from './AdminClient.js'
import { FileSystem } from '../fs/FileSystem.js'
import { RemoteProjectProvider } from '../project/RemoteProjectProvider.js'
import { Output } from '@contember/cli-common'

export class AdminDeployer {
	constructor(
		private readonly remoteProjectProvider: RemoteProjectProvider,
		private readonly adminClient: AdminClient,
		private readonly fs: FileSystem,
		private readonly output: Output = new Output(),
	) {
	}

	public deploy = async ({ dir, root }: {
		dir: string
		root: boolean
	}) => {
		this.output.info('Deploying admin...')
		const files = await this.readAdminFiles(dir)
		const project = root ? null : this.remoteProjectProvider.get().name

		// in some cases you need deploy whole folder with custom build etc.
		// with root option you can build app on your own and simply deploy it with subprojects
		await this.adminClient.deploy(project, files)

		this.output.info(`Admin deployed (${files.length} files)`)
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
