import { ConfigProcessor } from './ConfigProcessor'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor'
import { ProjectContainer } from './ProjectContainer'

export interface Plugin {
	getConfigProcessor?(): ConfigProcessor

	getSchemaContributor?(container: ProjectContainer): GraphQLSchemaContributor | undefined
}
