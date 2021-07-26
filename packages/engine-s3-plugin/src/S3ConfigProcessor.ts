import { ConfigProcessor, ConfigTemplate, ConfigTemplateContext } from '@contember/engine-plugins'
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
		return {
			...template,
			projectDefaults: {
				...template.projectDefaults,
				s3: {
					bucket: `%?project.env.S3_BUCKET%`,
					prefix: `%project.env.S3_PREFIX%`,
					region: `%project.env.S3_REGION%`,
					endpoint: `%project.env.S3_ENDPOINT%`,
					provider: '%project.env.S3_PROVIDER%',
					credentials: {
						key: `%?project.secret.s3.key||project.env.S3_KEY%`,
						secret: `%?project.secret.s3.secret||project.env.S3_SECRET%`,
					},
				},
			},
		}
	}

	processProjectConfig(slug: string, config: ProjectWithS3Config): ProjectWithS3Config {
		return {
			...config,
			s3: checkS3Config(config.s3, `projects.${slug}.s3`),
		}
	}
}

function checkS3Config(json: unknown, path: string): S3Config | undefined {
	if (json === undefined) {
		return undefined
	}
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

	const credentials = checkS3Credentials(json.credentials, `${path}.credentials`)
	if (credentials === undefined) {
		return undefined
	}
	return { ...json, credentials: credentials }
}

function checkS3Credentials(json: unknown, path: string): S3Config['credentials'] | undefined {
	if (json === undefined) {
		return undefined
	}
	if (!isObject(json)) {
		return typeConfigError(path, json, 'object')
	}
	if (json.key === undefined) {
		return undefined
	}
	if (!hasStringProperty(json, 'key')) {
		return typeConfigError(path + '.key', json.key, 'string')
	}
	if (!hasStringProperty(json, 'secret')) {
		return typeConfigError(path + '.secret', json.secret, 'string')
	}
	return json
}
