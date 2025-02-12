import { PackageManager } from './PackageManager'
import { FileSystem } from '../FileSystem'
import { Package } from '../Package'
import { PackageJson } from '../PackageJson'
import { join } from 'node:path'
import { PackageManagerHelpers } from './PackageManagerHelpers'
import { CommandRunner } from '../CommandRunner'

export class Bun implements PackageManager {
	constructor(
		private readonly fs: FileSystem,
		private readonly commandRunner: CommandRunner,
	) {
	}

	async install({ pckg, dependencies, isDev }: { pckg: Package; isDev: boolean; dependencies: Record<string, string> }): Promise<void> {
		const { output } = this.commandRunner.runCommand('bun', [
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

	async isActive({ dir }: { dir: string; packageJson: PackageJson }): Promise<boolean> {
		return await this.fs.pathExists(join(dir, 'bun.lock')) || await this.fs.pathExists(join(dir, 'bun.lockb'))
	}

	async readWorkspacePackages({ dir, packageJson }: { dir: string; packageJson: PackageJson }): Promise<Package[]> {
		return await PackageManagerHelpers.readWorkspacePackages({
			fs: this.fs,
			dir,
			workspaces: PackageManagerHelpers.getWorkspacesFromPackageJson({ packageJson }),
		})
	}
}
