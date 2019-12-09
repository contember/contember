import { S3 as AwsS3 } from 'aws-sdk'
import uuid from 'uuid'
import { extension } from 'mime-types'
import { S3Config } from './Config'

export enum S3Acl {
	None = 'none',
	PublicRead = 'public-read',
	Private = 'private',
}

type SignedReadUrl = {
	url: string
	bucket: string
	objectKey: string
	headers: { key: string; value: string }[]
	method: string
}

type SignedUploadUrl = {
	objectKey: string
	url: string
	bucket: string
	publicUrl: string
	headers: { key: string; value: string }[]
	method: string
}

export class S3Service {
	private readonly s3: AwsS3

	private readonly endpoint: string

	constructor(public readonly config: S3Config) {
		this.s3 = new AwsS3({
			accessKeyId: config.credentials.key,
			secretAccessKey: config.credentials.secret,
			region: config.region,
			signatureVersion: 'v4',
			endpoint: config.endpoint || 's3.{region}.amazonaws.com',
			s3ForcePathStyle: !!config.endpoint,
		})
		this.endpoint = this.s3.config.endpoint!
	}

	public getSignedUploadUrl(contentType: string, acl?: S3Acl, expiration?: number, prefix?: string): SignedUploadUrl {
		const ext = extension(contentType) || 'bin'
		const objectKey =
			(this.config.prefix ? this.config.prefix + '/' : '') + (prefix ? prefix + '/' : '') + `${uuid.v4()}.${ext}`
		const bucket = this.config.bucket
		if (acl && this.config.noAcl) {
			throw new Error('ACL is not supported')
		}

		const aclValue = this.config.noAcl || acl === S3Acl.None ? undefined : acl || S3Acl.PublicRead
		const url = this.s3.getSignedUrl('putObject', {
			Bucket: bucket,
			Key: objectKey,
			ContentType: contentType,
			CacheControl: 'immutable',
			Expires: expiration || 3600,
			...(aclValue ? { ACL: aclValue } : {}),
		})
		const publicUrl = this.formatPublicUrl(objectKey)
		return {
			bucket,
			objectKey,
			url,
			publicUrl,
			headers: [
				{
					key: 'Content-Type',
					value: contentType,
				},
				{
					key: 'Cache-Control',
					value: 'immutable',
				},
				...(aclValue ? [{ key: 'X-Amz-Acl', value: aclValue }] : []),
			],
			method: 'PUT',
		}
	}

	public getSignedReadUrl(objectKey: string, expiration?: number): SignedReadUrl {
		const bucket = this.config.bucket

		const publicPrefix = this.formatPublicUrl('')
		if (objectKey.startsWith(publicPrefix)) {
			objectKey = objectKey.substr(publicPrefix.length)
		}

		const url = this.s3.getSignedUrl('getObject', {
			Bucket: bucket,
			Key: objectKey,
			Expires: expiration || 3600,
		})
		return {
			bucket,
			objectKey,
			url,
			headers: [],
			method: 'GET',
		}
	}

	public formatPublicUrl(key: string): string {
		const hostUrl = this.endpoint.includes('://') ? this.endpoint : 'https://' + this.endpoint
		return `${hostUrl}/${this.config.bucket}/${key}`
	}
}

export class S3ServiceFactory {
	public create(config: S3Config) {
		return new S3Service(config)
	}
}
