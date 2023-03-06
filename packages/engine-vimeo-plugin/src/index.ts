import { Plugin, SchemaContributorArgs } from '@contember/engine-plugins'
import { VimeoConfigProcessor } from './VimeoConfigProcessor'
import { VimeoSchemaContributor } from './VimeoSchemaContributor'
import { VimeoServiceFactory } from './VimeoService'
import { ProjectVimeoConfig } from './Config'

export * from './VimeoSchemaContributor'
export * from './VimeoService'

export default class VimeoPlugin implements Plugin<ProjectVimeoConfig> {
	name = 'contember/vimeo'

	getConfigProcessor() {
		return new VimeoConfigProcessor()
	}

	getSchemaContributor({ project }: SchemaContributorArgs<ProjectVimeoConfig>) {
		if (!project.vimeo) {
			return undefined
		}
		const vimeoServiceFactory = new VimeoServiceFactory()
		return new VimeoSchemaContributor(project.vimeo, vimeoServiceFactory)
	}
}
