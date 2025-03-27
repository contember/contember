import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

export const detectPackageManager = (): PackageManager => {
	const userAgent = process.env.npm_config_user_agent

	if (userAgent) {
		if (userAgent.startsWith('yarn/')) return 'yarn'
		if (userAgent.startsWith('pnpm/')) return 'pnpm'
		if (userAgent.startsWith('npm/')) return 'npm'
		if (userAgent.startsWith('bun/')) return 'bun'
	}

	const cwd = process.cwd()
	if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn'
	if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
	if (existsSync(join(cwd, 'package-lock.json'))) return 'npm'
	if (existsSync(join(cwd, 'bun.lockb'))) return 'bun'
	if (existsSync(join(cwd, 'bun.lock'))) return 'bun'

	return 'npm'
}
