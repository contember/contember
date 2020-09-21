import { Builder, Container } from '@contember/dic'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'

export type ProjectConfig = any // todo

export interface ProjectContainer {
	project: ProjectConfig
	graphqlObjectsFactory: GraphQLObjectsFactory
}

export type ProjectContainerBuilder = Builder<ProjectContainer>
