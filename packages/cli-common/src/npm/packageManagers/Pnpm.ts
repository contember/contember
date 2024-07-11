import { FileSystem } from '../FileSystem'
import { join } from 'node:path'

import { PackageJson } from '../PackageJson'
import { PackageManager } from './PackageManager'
import { Package } from '../Package'
import { PackageManagerHelpers } from './PackageManagerHelpers'
import { CommandRunner } from '../CommandRunner'

export class Pnpm implements PackageManager {
	constructor(
		private readonly fs: FileSystem,
		private readonly commandRunner: CommandRunner,
	) {
	}

	async install({ pckg, dependencies, isDev }: { pckg: Package; isDev: boolean; dependencies: Record<string, string> }): Promise<void> {
		const { output } = this.commandRunner.runCommand('pnpm', [
			'add',
			isDev ? '--save-dev' : '--save',
			pckg.isRoot ? '--ignore-workspace-root-check' : undefined,
			...PackageManagerHelpers.formatPackagesToInstall(dependencies),
		], {
			cwd: pckg.dir,
			stderr: process.stderr,
			stdout: process.stdout,
		})
		await output
	}

	async isActive({ dir, packageJson }: { dir: string; packageJson: PackageJson }): Promise<boolean> {
		return await this.fs.pathExists(join(dir, 'pnpm-lock.yaml'))
	}

	async readWorkspacePackages({ dir, packageJson }: { dir: string; packageJson: PackageJson }): Promise<Package[]> {
		let pnpmWorkspaces: any
		if (await this.fs.pathExists(join(dir, 'pnpm-workspace.yaml'))) {
			pnpmWorkspaces = JSON.parse(await this.fs.readFile(join(dir, 'pnpm-workspace.yaml'), 'utf-8'))
		}
		return await PackageManagerHelpers.readWorkspacePackages({
			fs: this.fs,
			dir,
			workspaces: pnpmWorkspaces.packages,
		})
	}
}
