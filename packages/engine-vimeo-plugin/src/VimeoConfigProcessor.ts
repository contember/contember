import { ConfigProcessor } from '@contember/engine-plugins'
import { isObject, typeConfigError, hasStringProperty } from '@contember/engine-common'
import { ProjectWithVimeoConfig, VimeoConfig } from './Config'

export class VimeoConfigProcessor implements ConfigProcessor<ProjectWithVimeoConfig> {
	processProjectConfig(slug: string, config: ProjectWithVimeoConfig): ProjectWithVimeoConfig {
		return {
			...config,
			vimeo: checkVimeoConfig(config.vimeo, `projects.${slug}.vimeo`),
		}
	}
}

function checkVimeoConfig(json: unknown, path: string): VimeoConfig | undefined {
	if (json === undefined) {
		return undefined
	}
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	if (json.token === undefined) {
		return undefined
	}
	if (!hasStringProperty(json, 'token')) {
		return typeConfigError(path + '.token', json.token, 'string')
	}
	return json
}
