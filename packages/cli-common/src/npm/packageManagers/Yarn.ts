import { PackageManager } from './PackageManager'
import { FsManager } from '../FsManager'
import { Package } from '../Package'
import { PackageJson } from '../PackageJson'
import { join } from 'node:path'
import { PackageManagerHelpers } from './PackageManagerHelpers'
import { runCommand } from '../../utils/commands'

export class Yarn implements PackageManager {
	constructor(
		private readonly fsManager: FsManager,
	) {
	}

	async install({ pckg, dependencies, isDev }: { pckg: Package; isDev: boolean; dependencies: Record<string, string> }): Promise<void> {
		const { output } = runCommand('yarn', [
			'add',
			isDev ? '--dev' : undefined,
			...PackageManagerHelpers.formatPackagesToInstall(dependencies),
		], {
			cwd: pckg.dir,
			stderr: process.stderr,
			stdout: process.stdout,
		})
		await output
	}

	async isActive({ dir, packageJson }: { dir: string; packageJson: PackageJson }): Promise<boolean> {
		return await this.fsManager.exists(join(dir, 'yarn.lock'))
			&& (!packageJson.packageManager || (packageJson.packageManager as string).startsWith('yarn@3') || (packageJson.packageManager as string).startsWith('yarn@2'))
	}

	async readWorkspacePackages({ dir, packageJson }: { dir: string; packageJson: PackageJson }): Promise<Package[]> {
		return await PackageManagerHelpers.readWorkspacePackages({
			fsManager: this.fsManager,
			dir,
			workspaces: PackageManagerHelpers.getWorkspacesFromPackageJson({ packageJson }),
		})
	}
}
