import { Package } from '../Package'
import { PackageJson } from '../PackageJson'
import { join } from 'node:path'
import { FileSystem } from '../FileSystem'

export class PackageManagerHelpers {
	static async readWorkspacePackages({ fs, dir, workspaces }: {
		fs: FileSystem
		dir: string
		workspaces: string[]
	}): Promise<Package[]> {
		const dirs = await fs.listDirectories(dir, workspaces)

		const packageJson = await Promise.all(dirs.map(async it => {
			const packageJsonPath = join(dir, it, 'package.json')
			if (!(await fs.pathExists(packageJsonPath))) {
				return null
			}
			const packageJson: PackageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
			return [packageJson, it] as const
		}))

		return packageJson.filter(<T>(it: T | null): it is T => it !== null).map(([packageJson, subDir]) => new Package(join(dir, subDir), false, packageJson))
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
