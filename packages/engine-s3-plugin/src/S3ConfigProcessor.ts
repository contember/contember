import { ProjectConfig, ConfigProcessor, ConfigTemplate, ConfigTemplateContext } from '@contember/engine-plugins'
import { isObject, typeConfigError, hasStringProperty } from '@contember/engine-common'
import { ProjectWithS3Config, S3Config } from './Config'

export class S3ConfigProcessor implements ConfigProcessor<ProjectWithS3Config> {
	getDefaultEnv(): Record<string, string> {
		return {
			DEFAULT_S3_PREFIX: '',
			DEFAULT_S3_ENDPOINT: '',
			DEFAULT_S3_REGION: 'us-east-1',
			DEFAULT_S3_PROVIDER: 'aws',
		}
	}

	prepareConfigTemplate(template: ConfigTemplate, { env }: ConfigTemplateContext) {
		const hasS3config = Object.keys(env).find(it => it.endsWith('_S3_KEY'))
		if (hasS3config) {
			template = {
				...template,
				projectDefaults: {
					...template.projectDefaults,
					s3: {
						bucket: `%project.env.S3_BUCKET%`,
						prefix: `%project.env.S3_PREFIX%`,
						region: `%project.env.S3_REGION%`,
						endpoint: `%project.env.S3_ENDPOINT%`,
						provider: '%project.env.S3_PROVIDER%',
						credentials: {
							key: `%project.env.S3_KEY%`,
							secret: `%project.env.S3_SECRET%`,
						},
					},
				},
			}
		}
		return template
	}

	processProjectConfig(slug: string, config: ProjectWithS3Config): ProjectWithS3Config {
		return {
			...config,
			s3: config.s3 ? checkS3Config(config.s3, `projects.${slug}.s3`) : undefined,
		}
	}
}

function checkS3Config(json: unknown, path: string): S3Config {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	if (!hasStringProperty(json, 'bucket')) {
		return typeConfigError(path + '.bucket', json.bucket, 'string')
	}
	if (!hasStringProperty(json, 'prefix')) {
		return typeConfigError(path + '.prefix', json.prefix, 'string')
	}
	if (!hasStringProperty(json, 'region')) {
		return typeConfigError(path + '.region', json.region, 'string')
	}

	return { ...json, credentials: checkS3Credentials(json.credentials, `${path}.credentials`) }
}

function checkS3Credentials(json: unknown, path: string): S3Config['credentials'] {
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	if (!hasStringProperty(json, 'key')) {
		return typeConfigError(path + '.key', json.key, 'string')
	}
	if (!hasStringProperty(json, 'secret')) {
		return typeConfigError(path + '.secret', json.secret, 'string')
	}
	return json
}
