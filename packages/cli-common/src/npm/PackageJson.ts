export type PackageJson =
	& {
		name: string
		version: string
		dependencies?: Record<string, string>
		devDependencies?: Record<string, string>
		workspaces?: string[] | { packages?: string[]; nohoist?: string[] }
	}
	& {
		[prop: string]: undefined
	}
