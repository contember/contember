import { PackageJson } from './PackageJson'

export class Package {
	constructor(
		public readonly dir: string,
		public readonly isRoot: boolean,
		public readonly packageJson: PackageJson,
	) {
	}
}
