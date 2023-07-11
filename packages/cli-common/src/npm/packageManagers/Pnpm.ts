import { FsManager } from '../FsManager'
import { join } from 'node:path'

import { PackageJson } from '../PackageJson'
import { PackageManager } from './PackageManager'
import { Package } from '../Package'
import { PackageManagerHelpers } from './PackageManagerHelpers'
import { runCommand } from '../../utils/commands'

export class Pnpm implements PackageManager {
	constructor(
		private readonly fsManager: FsManager,
	) {
	}

	async install({ pckg, dependencies, isDev }: { pckg: Package; isDev: boolean; dependencies: Record<string, string> }): Promise<void> {
		const { output } = runCommand('pnpm', [
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
		return await this.fsManager.exists(join(dir, 'pnpm-lock.yaml'))
	}

	async readWorkspacePackages({ dir, packageJson }: { dir: string; packageJson: PackageJson }): Promise<Package[]> {
		const pnpmWorkspaces = await this.fsManager.tryReadJson(join(dir, 'pnpm-workspace.yaml'))
		return await PackageManagerHelpers.readWorkspacePackages({
			fsManager: this.fsManager,
			dir,
			workspaces: pnpmWorkspaces.packages,
		})
	}
}
