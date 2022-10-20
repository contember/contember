import { ConfigProcessor, ConfigTemplate, ConfigTemplateContext } from '@contember/engine-plugins'
import { Project3Config, s3ConfigSchema } from './Config'
import * as Typesafe from '@contember/typesafe'

export class S3ConfigProcessor implements ConfigProcessor<Project3Config> {
	getDefaultEnv(): Record<string, string> {
		return {
			DEFAULT_S3_ENDPOINT: '',
			DEFAULT_S3_REGION: 'us-east-1',
			DEFAULT_S3_PROVIDER: 'aws',
		}
	}

	prepareConfigTemplate(template: ConfigTemplate, { env }: ConfigTemplateContext) {
		return {
			...template,
			projectDefaults: {
				...template.projectDefaults,
				s3: {
					bucket: `%?project.env.S3_BUCKET%`,
					prefix: `%?project.env.S3_PREFIX||project.slug%`,
					region: `%project.env.S3_REGION%`,
					endpoint: `%project.env.S3_ENDPOINT%`,
					cdnEndpoint: `%?project.env.S3_CDN%`,
					provider: '%project.env.S3_PROVIDER%',
					credentials: {
						key: `%?project.secret.s3.key||project.env.S3_KEY%`,
						secret: `%?project.secret.s3.secret||project.env.S3_SECRET%`,
					},
				},
			},
		}
	}

	getProjectConfigSchema(slug: string): Typesafe.Type<Record<string, any>> {
		return Typesafe.union(
			(input: unknown, path: PropertyKey[] = []) => Typesafe.valueAt(input, ['s3', 'credentials', 'key']) === undefined ? {} : Typesafe.fail(path),
			Typesafe.object({
				s3: s3ConfigSchema,
			}),
		)
	}

}
