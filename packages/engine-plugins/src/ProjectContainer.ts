import { Builder } from '@contember/dic'

export type ProjectConfig = any // todo

export type Providers = {
	uuid: () => string
	now: () => Date
}

export interface ProjectContainer {
	project: ProjectConfig
	providers: Providers
}

export type ProjectContainerBuilder = Builder<ProjectContainer>
