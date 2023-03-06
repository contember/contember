import { ConfigProcessor, ConfigTemplate, ConfigTemplateContext } from '@contember/engine-plugins'
import * as Typesafe from '@contember/typesafe'
import { ProjectVimeoConfig, vimeoConfigSchema } from './Config'

export class VimeoConfigProcessor implements ConfigProcessor<ProjectVimeoConfig> {
	getProjectConfigSchema?(slug: string): Typesafe.Type<ProjectVimeoConfig> {
		return Typesafe.union(
			(input, path = []) => Typesafe.valueAt(input, ['vimeo', 'token']) === undefined ? {} : Typesafe.fail(path),
			Typesafe.object({
				vimeo: vimeoConfigSchema,
			}),
		)
	}

	prepareConfigTemplate(template: ConfigTemplate, { env }: ConfigTemplateContext) {
		return {
			...template,
			projectDefaults: {
				...template.projectDefaults,
				vimeo: {
					token: `%?project.secret.vimeo.token||project.env.VIMEO_TOKEN%`,
				},
			},
		}
	}
}
