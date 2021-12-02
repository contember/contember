import { ConfigProcessor, ConfigTemplate, ConfigTemplateContext } from '@contember/engine-plugins'
import { Typesafe } from '@contember/engine-common'
import { ProjectWithVimeoConfig, vimeoConfigSchema } from './Config'

export class VimeoConfigProcessor implements ConfigProcessor<ProjectWithVimeoConfig> {
	getProjectConfigSchema?(slug: string): Typesafe.Type<Record<string, any>> {
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
			vimeo: {
				token: `%?project.secret.vimeo.token||project.env.VIMEO_TOKEN%`,
			},
		}
	}
}
