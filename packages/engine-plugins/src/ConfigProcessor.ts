export type Env = Record<string, string>
export type ConfigTemplate = any // fixme
export type Config = {
	projects: Record<string, Record<string, unknown>>
}

export type ConfigTemplateContext = { env: Env }
export type ConfigContext = { env: Env }

export interface ConfigProcessor {
	getDefaultEnv(): Env

	prepareConfigTemplate(template: ConfigTemplate, context: ConfigTemplateContext): ConfigTemplate

	processConfig<C extends Config>(config: C, context: ConfigContext): C
}
