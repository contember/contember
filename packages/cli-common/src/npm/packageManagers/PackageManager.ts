import { PackageJson } from '../PackageJson'

import { Package } from '../Package'

export interface PackageManager {
	isActive(args: { dir: string; packageJson: PackageJson }): Promise<boolean>

	readWorkspacePackages(args: { dir: string; packageJson: PackageJson }): Promise<Package[]>

	install(args: { pckg: Package; isDev: boolean; dependencies: Record<string, string> }): Promise<void>
}
