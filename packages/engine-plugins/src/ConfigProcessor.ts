import { ProjectConfig } from './ProjectContainer'
import { Typesafe } from '@contember/engine-common'

export type Env = Record<string, string>
export type ConfigTemplate = any // fixme

export type Config = Record<string, unknown>

export type ConfigTemplateContext = { env: Env }

export interface ConfigProcessor<ProjectConf extends ProjectConfig = ProjectConfig> {
	getDefaultEnv?(): Env

	prepareConfigTemplate?(template: ConfigTemplate, context: ConfigTemplateContext): ConfigTemplate

	getProjectConfigSchema?(slug: string): Typesafe.Type<Record<string, any>>
}
