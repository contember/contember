import { Plugin, ProjectContainer } from '@contember/engine-plugins'
import { VimeoConfigProcessor } from './VimeoConfigProcessor'
import { VimeoSchemaContributor } from './VimeoSchemaContributor'
import { VimeoServiceFactory } from './VimeoService'
import { ProjectWithVimeoConfig } from './Config'

export * from './VimeoSchemaContributor'
export * from './VimeoService'

export default class VimeoPlugin implements Plugin<ProjectWithVimeoConfig> {
	name = 'contember/vimeo'

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
