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
	const endpoint = config.endpoint || `https://${config.bucket}.s3.${config.region || defaultRegion}.amazonaws.com`
	const hasCustomEndpoint = !!config.endpoint
	const basePath = hasCustomEndpoint ? `/${config.bucket}` : ''
	const baseUrl = endpoint + basePath
	return { endpoint, basePath, baseUrl }
}
