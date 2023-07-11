import { FsManager } from '../FsManager'
import { Package } from '../Package'
import { PackageJson } from '../PackageJson'
import { join } from 'node:path'

export class PackageManagerHelpers {
	static async readWorkspacePackages({ fsManager, dir, workspaces }: {
		fsManager: FsManager
		dir: string
		workspaces: string[]
	}): Promise<Package[]> {
		const dirs = await fsManager.listDirectories(dir, workspaces)

		const packageJson = await Promise.all(dirs.map(async it => {
			const packageJson = await fsManager.tryReadJson<PackageJson>(join(it, 'package.json'))
			return packageJson ? [packageJson, it] as const : null
		}))

		return packageJson.filter(<T>(it: T | null): it is T => it !== null).map(([packageJson, dir]) => new Package(dir, false, packageJson))
	}

	static getWorkspacesFromPackageJson({ packageJson }: { packageJson: PackageJson }): string[] {
		if (!packageJson.workspaces) {
			return []
		}
		if (Array.isArray(packageJson.workspaces)) {
			return packageJson.workspaces
		}
		return [...packageJson.workspaces?.packages ?? [], ...packageJson.workspaces?.nohoist ?? []]
	}

	static formatPackagesToInstall(packages: Record<string, string>): string[] {
		return Object.entries(packages).map(([name, version]) => `${name}@${version}`)
	}
}
