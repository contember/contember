import * as Typesafe from '@contember/typesafe'

import { Env } from './config'

export type ConfigTemplate = any // fixme

export type Config = Record<string, unknown>

export type ConfigTemplateContext = { env: Env }

export interface ConfigProcessor<CustomConfig extends Typesafe.JsonObject> {
	getDefaultEnv?(): Env

	prepareConfigTemplate?(template: ConfigTemplate, context: ConfigTemplateContext): ConfigTemplate

	getProjectConfigSchema?(slug: string): Typesafe.Type<CustomConfig>
}
