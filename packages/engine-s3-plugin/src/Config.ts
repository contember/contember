import { ProjectConfig } from '@contember/engine-plugins'

export enum S3Providers {
	aws = 'aws',
	minio = 'minio',
	ceph = 'ceph',
	localstack = 'localstack',
	cloudserver = 'cloudserver',
}

export interface S3Config {
	readonly bucket: string
	readonly region: string
	readonly prefix: string
	readonly endpoint?: string
	readonly provider?: S3Providers
	readonly noAcl?: boolean
	readonly credentials: {
		readonly key: string
		readonly secret: string
	}
}

export type ProjectWithS3Config = ProjectConfig<{ s3?: S3Config }>

// todo
const serversWithoutAclSupport = [S3Providers.minio]

export const resolveS3Config = (config: S3Config): S3Config => {
	return {
		noAcl: config.provider && serversWithoutAclSupport.includes(config.provider),
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
