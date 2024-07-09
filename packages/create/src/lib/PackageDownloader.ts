import npa from 'npm-package-arg'
import getRegistryInfo from 'registry-info'
import getPackageJson from 'get-package-json-from-registry'
import { join } from 'node:path'
import downloadTarball from 'download-tarball'
import { FileSystem } from './FileSystem'

export class PackageDownloader {

	constructor(
		private readonly fs: FileSystem,
	) {
	}

	downloadPackage = async (pkgName: string): Promise<string> => {
		const { scope } = npa(pkgName)
		const { authorization } = getRegistryInfo(scope)
		const headers = authorization ? { authorization } : {}

		const pkg = await getPackageJson(pkgName)
		const {
			dist: { tarball },
		} = pkg

		const tmpDir = await this.fs.createTempDir()
		await downloadTarball({ url: tarball, gotOpts: { headers }, dir: tmpDir })
		const dirContent = await this.fs.readDir(tmpDir)
		if (dirContent.length !== 1 || dirContent[0] !== 'package') {
			throw 'Invalid NPM package'
		}
		return join(tmpDir, 'package')
	}
}
