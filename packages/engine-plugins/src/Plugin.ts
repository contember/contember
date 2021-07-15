import { ConfigProcessor } from './ConfigProcessor'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor'
import { ProjectConfig, ProjectContainer } from './ProjectContainer'

export interface Plugin<ProjectConf extends ProjectConfig = ProjectConfig> {
	getConfigProcessor?(): ConfigProcessor<ProjectConf>

	getSchemaContributor?(container: ProjectContainer<ProjectConf>): GraphQLSchemaContributor | undefined
}
