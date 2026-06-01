import { isAbsolute, resolve } from 'node:path'
import { JsCodeRunner } from '../js/JsCodeRunner.js'
import { TenantConfig } from './tenantConfig.js'

const resolvePath = (path: string): string => isAbsolute(path) ? path : resolve(process.cwd(), path)

const extractDefault = (result: unknown): TenantConfig => {
	if (typeof result !== 'object' || result === null || !('default' in result)) {
		throw `Tenant config file must have a default export (use \`export default defineTenantConfig({ ... })\`).`
	}
	const config = (result as { default: unknown }).default
	if (typeof config !== 'object' || config === null) {
		throw `Default export of the tenant config file must be an object.`
	}
	return config as TenantConfig
}

export interface TenantConfigLoader {
	loadConfig(path: string): Promise<TenantConfig>
}

/** Loads a `tenant.config.ts` directly via dynamic import (Bun runtime). */
export class ImportTenantConfigLoader implements TenantConfigLoader {
	async loadConfig(path: string): Promise<TenantConfig> {
		const result = await import(resolvePath(path))
		return extractDefault(result)
	}
}

/** Loads a `tenant.config.ts` by transpiling it first (Node runtime). */
export class TranspilingTenantConfigLoader implements TenantConfigLoader {
	constructor(
		private readonly jsCodeRunner: JsCodeRunner,
	) {
	}

	async loadConfig(path: string): Promise<TenantConfig> {
		const result = await this.jsCodeRunner.run(resolvePath(path))
		return extractDefault(result)
	}
}
