import { ProjectConfig } from './ProjectContainer'

export type Env = Record<string, string>
export type ConfigTemplate = any // fixme

export type Config = Record<string, unknown>

export type ConfigTemplateContext = { env: Env }
export type ConfigContext = { env: Env }

export interface ConfigProcessor<ProjectConf extends ProjectConfig = ProjectConfig> {
	getDefaultEnv?(): Env

	prepareConfigTemplate?(template: ConfigTemplate, context: ConfigTemplateContext): ConfigTemplate

	processConfig?<C extends Config>(config: C, context: ConfigContext): C

	processProjectConfig?<C>(slug: string, config: C & ProjectConfig<ProjectConf>): C & ProjectConfig<ProjectConf>
}
