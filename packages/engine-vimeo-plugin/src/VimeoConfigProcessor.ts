import { Config, ConfigProcessor, ConfigTemplate } from '@contember/engine-plugins'
import { isObject, typeConfigError, hasStringProperty } from '@contember/engine-common'
import { VimeoConfig } from './Config'

export class VimeoConfigProcessor implements ConfigProcessor {
	getDefaultEnv(): Record<string, string> {
		return {}
	}

	prepareConfigTemplate(template: ConfigTemplate) {
		return template
	}

	processConfig<C extends Config>(config: C): C {
		return {
			...config,
			projects: Object.fromEntries(
				Object.entries(config.projects).map(([slug, project]) => [
					slug,
					{
						...project,
						vimeo: checkVimeoConfig(project.vimeo, `projects.${slug}.vimeo`),
					},
				]),
			),
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
