import { Plugin, SchemaContributorArgs } from '@contember/engine-plugins'
import { VimeoConfigProcessor } from './VimeoConfigProcessor.js'
import { VimeoSchemaContributor } from './VimeoSchemaContributor.js'
import { VimeoServiceFactory } from './VimeoService.js'
import { ProjectVimeoConfig } from './Config.js'

export * from './VimeoSchemaContributor.js'
export * from './VimeoService.js'

export default class VimeoPlugin implements Plugin<ProjectVimeoConfig> {
	name = 'contember/vimeo'

	getConfigProcessor() {
		return new VimeoConfigProcessor()
	}

	getSchemaContributor() {
		const vimeoServiceFactory = new VimeoServiceFactory()
		return new VimeoSchemaContributor(vimeoServiceFactory)
	}
}
