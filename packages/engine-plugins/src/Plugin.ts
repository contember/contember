import { ConfigProcessor } from './ConfigProcessor.js'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor.js'
import { ProjectConfig, ProjectContainer } from './ProjectContainer.js'

export interface Plugin<ProjectConf extends ProjectConfig = ProjectConfig> {
	getConfigProcessor?(): ConfigProcessor<ProjectConf>

	getSchemaContributor?(container: ProjectContainer<ProjectConf>): GraphQLSchemaContributor | undefined
}
