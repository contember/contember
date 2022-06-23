import { ProjectConfig } from './ProjectContainer.js'
import * as Typesafe from '@contember/typesafe'

export type Env = Record<string, string>
export type ConfigTemplate = any // fixme

export type Config = Record<string, unknown>

export type ConfigTemplateContext = { env: Env }

export interface ConfigProcessor<ProjectConf extends ProjectConfig = ProjectConfig> {
	getDefaultEnv?(): Env

	prepareConfigTemplate?(template: ConfigTemplate, context: ConfigTemplateContext): ConfigTemplate

	getProjectConfigSchema?(slug: string): Typesafe.Type<Typesafe.JsonObject>
}
