import { Plugin, ProjectContainer } from '@contember/engine-plugins'
import { VimeoConfigProcessor } from './VimeoConfigProcessor.js'
import { VimeoSchemaContributor } from './VimeoSchemaContributor.js'
import { VimeoServiceFactory } from './VimeoService.js'
import { ProjectWithVimeoConfig } from './Config.js'

export * from './VimeoSchemaContributor.js'
export * from './VimeoService.js'

export default class VimeoPlugin implements Plugin<ProjectWithVimeoConfig> {
	getConfigProcessor() {
		return new VimeoConfigProcessor()
	}

	getSchemaContributor(container: ProjectContainer<ProjectWithVimeoConfig>) {
		const projectConfig = container.project
		if (!projectConfig.vimeo) {
			return undefined
		}
		const vimeoServiceFactory = new VimeoServiceFactory()
		return new VimeoSchemaContributor(projectConfig.vimeo, vimeoServiceFactory)
	}
}
