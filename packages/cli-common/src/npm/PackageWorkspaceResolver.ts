import { PackageManager } from './packageManagers/PackageManager'
import { Yarn } from './packageManagers/Yarn'
import { YarnClassic } from './packageManagers/YarnClassic'
import { Pnpm } from './packageManagers/Pnpm'
import { Npm } from './packageManagers/Npm'
import { PackageJson } from './PackageJson'
import { dirname, join } from 'node:path'
import { Package } from './Package'
import { PackageWorkspace } from './PackageWorkspace'
import { FileSystem } from './FileSystem'

export class PackageWorkspaceResolver {
	constructor(
		private readonly dir: string,
		private fs: FileSystem,
		private packageManagers: PackageManager[],
	) {
	}

	public async resolve(): Promise<PackageWorkspace> {
		return await this.resolveInternal(this.dir)
	}

	public async resolveInternal(dir: string, packageJsonFound: boolean = false): Promise<PackageWorkspace> {
		if (!(await this.fs.pathExists(join(dir, 'package.json')))) {
			if (dir === '/') {
				if (packageJsonFound) {
					throw `No lockfile found. Please install dependencies using package manager of your choice.`
				} else {
					throw `package.json not found.`
				}
			}
			return await this.resolveInternal(dirname(dir), packageJsonFound)
		}

		const packageJson = JSON.parse(await this.fs.readFile(join(dir, 'package.json'), 'utf-8')) as PackageJson

		const pm = await this.resolvePackageManager({ dir, packageJson })
		if (!pm) {
			if (dir === '/') {
				throw `No lockfile found. Please install dependencies using package manager of your choice.`
			}
			return await this.resolveInternal(dirname(dir), true)
		}

		const rootPackage = new Package(dir, true, packageJson)
		const workspacePackages = await pm.readWorkspacePackages({ dir, packageJson })

		return new PackageWorkspace(pm, this.fs, rootPackage, workspacePackages)
	}

	private async resolvePackageManager(args: { dir: string; packageJson: PackageJson }): Promise<PackageManager | null> {
		for (const pm of this.packageManagers) {
			if (await pm.isActive(args)) {
				return pm
			}
		}
		return null
	}
}
