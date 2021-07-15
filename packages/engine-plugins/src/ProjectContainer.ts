import { Builder } from '@contember/dic'

export type ProjectConfig<Config = Record<string, unknown>> = Config & Record<string, unknown>

export type Providers = {
	uuid: () => string
	now: () => Date
}

export interface ProjectContainer<Config> {
	project: ProjectConfig<Config>
	providers: Providers
}

export type ProjectContainerBuilder = Builder<ProjectContainer<any>>
