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
