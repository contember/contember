import getRegistryInfo from 'registry-info'
import getPackageJson from 'get-package-json-from-registry'
import npa from 'npm-package-arg'
import downloadTarball from 'download-tarball'
import { move, readdir, remove } from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'

export const downloadPackage = async (pkgName: string, dir: string): Promise<void> => {
	const { scope } = npa(pkgName)
	const { authorization } = getRegistryInfo(scope)
	const headers = authorization ? { authorization } : {}

	const pkg = await getPackageJson(pkgName)
	const {
		dist: { tarball },
	} = pkg

	const tmpDir = join(tmpdir(), 'contember-' + Math.random())
	await downloadTarball({ url: tarball, gotOpts: { headers }, dir: tmpDir })
	const dirContent = await readdir(tmpDir)
	if (dirContent.length !== 1 || dirContent[0] !== 'package') {
		throw 'Invalid NPM package'
	}
	await move(join(tmpDir, 'package'), dir)
	await remove(tmpDir)
}
