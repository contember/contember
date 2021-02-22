import { Builder } from '@contember/dic'

export type ProjectConfig = any // todo

export interface ProjectContainer {
	project: ProjectConfig
}

export type ProjectContainerBuilder = Builder<ProjectContainer>
