import { PackageManager } from './packageManagers/PackageManager'
import { Package } from './Package'
import { dirname, join } from 'node:path'
import { PackageJson } from './PackageJson'
import { FileSystem } from './FileSystem'

export type Dependency = {
	pckg: Package
	isDev: boolean
	version: string
	name: string
}


export class PackageWorkspace {
	constructor(
		private readonly packageManager: PackageManager,
		private readonly fs: FileSystem,
		public readonly rootPackage: Package,
		public readonly packages: Package[],
	) {
	}

	get allPackages() {
		return [this.rootPackage, ...this.packages]
	}

	public findDefinedDependencies(packageName: string): Dependency[] {
		return this.allPackages.flatMap<Dependency>(it => {
			for (const type of ['dependencies', 'devDependencies'] as const) {
				const version = it.packageJson[type]?.[packageName]
				if (version) {
					return [{ pckg: it, isDev: type === 'devDependencies', version: version, name: packageName }]
				}
			}
			return []
		})
	}

	public async findInstalledDependencies(packageName: string): Promise<{ installed?: Dependency; defined: Dependency }[]> {
		const definedDependencies = this.findDefinedDependencies(packageName)

		const deps: { installed?: Dependency; defined: Dependency }[] = []
		for (const defined of definedDependencies) {
			const packageJsonPath = await this.resolvePackageJson(defined.pckg.dir, packageName)
			if (!packageJsonPath) {
				deps.push({ defined })
				continue
			}
			const packageJson = JSON.parse(await this.fs.readFile(packageJsonPath, 'utf-8'))
			deps.push({ defined, installed: { ...defined, version: packageJson?.version ?? '' } })
		}
		return deps
	}

	private async resolvePackageJson(dir: string, packageName: string) {
		while (true) {
			const fullPath = join(dir, 'node_modules', packageName, 'package.json')
			if (await this.fs.pathExists(fullPath)) {
				return fullPath
			}
			if (dir === '/') {
				return null
			}
			dir = dirname(dir)
		}
	}

	async updateEverywhere(updates: Record<string, string>): Promise<Dependency[]> {
		const defined = Object.keys(updates).flatMap(it => this.findDefinedDependencies(it))
		const byPckg = new Map<Package, Dependency[]>()
		for (const it of defined) {
			const arr = byPckg.get(it.pckg) ?? []
			byPckg.set(it.pckg, arr)
			arr.push(it)
		}

		const updated: Dependency[] = []
		for (const [pckg, deps] of byPckg.entries()) {
			const prod = deps.filter(it => !it.isDev)
			const dev = deps.filter(it => it.isDev)
			for (const [isDev, deps] of [[false, prod], [true, dev]] as const) {
				if (deps.length === 0) {
					continue
				}
				await this.packageManager.install({
					pckg,
					isDev,
					dependencies: Object.fromEntries(deps.map(it => [it.name, updates[it.name]])),
				})
				updated.push(...deps)
			}
		}
		return updated
	}
}

