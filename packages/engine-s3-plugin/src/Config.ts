import { ProjectConfig } from '@contember/engine-plugins'
import { Typesafe } from '@contember/engine-common'

export enum S3Providers {
	aws = 'aws',
	minio = 'minio',
	ceph = 'ceph',
	localstack = 'localstack',
	cloudserver = 'cloudserver',
}


export const s3ConfigSchema = Typesafe.intersection(
	Typesafe.object({
		bucket: Typesafe.string,
		region: Typesafe.string,
		prefix: Typesafe.string,
		credentials: Typesafe.object({
			key: Typesafe.string,
			secret: Typesafe.string,
		}),
	}),
	Typesafe.partial({
		endpoint: Typesafe.string,
		provider: Typesafe.enumeration(S3Providers.aws, S3Providers.minio, S3Providers.ceph, S3Providers.localstack, S3Providers.cloudserver),
		noAcl: Typesafe.boolean,
	}),
)

export type S3Config = ReturnType<typeof s3ConfigSchema>

export type ProjectWithS3Config = ProjectConfig<{ s3?: S3Config }>

// todo
const serversWithoutAclSupport = [S3Providers.minio]

export const resolveS3Config = (config: S3Config): S3Config => {
	return {
		noAcl: !!config.provider && serversWithoutAclSupport.includes(config.provider),
		...config,
	}
}

const defaultRegion = 'eu-west-1'

export const resolveS3Endpoint = (
	config: S3Config,
): {
	endpoint: string
	basePath: string
	baseUrl: string
} => {
	const hasLegacyPath = !!config.endpoint || config.bucket.includes('.')
	const endpoint = config.endpoint || `https://${hasLegacyPath ? '' : `${config.bucket}.`}s3.${config.region || defaultRegion}.amazonaws.com`
	const basePath = hasLegacyPath ? `/${config.bucket}` : ''

	const baseUrl = endpoint + basePath
	return { endpoint, basePath, baseUrl }
}
