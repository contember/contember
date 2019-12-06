import { S3 as AwsS3 } from 'aws-sdk'
import uuid from 'uuid'
import { extension } from 'mime-types'
import { S3Config } from './Config'

export class S3Service {
	private readonly s3: AwsS3

	private readonly endpoint: string

	constructor(private config: S3Config) {
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

	public getSignedUrl(contentType: string): { objectKey: string; url: string; bucket: string; publicUrl: string } {
		const ext = extension(contentType) || 'bin'
		const objectKey = (this.config.prefix ? this.config.prefix + '/' : '') + `${uuid.v4()}.${ext}`
		const bucket = this.config.bucket
		const url = this.s3.getSignedUrl('putObject', {
			Bucket: bucket,
			Key: objectKey,
			ContentType: contentType,
			CacheControl: 'immutable',
			Expires: 3600,
			...(this.config.noAcl ? {} : { ACL: 'public-read' }),
		})
		const publicUrl = this.formatPublicUrl(objectKey)
		return { bucket, objectKey, url, publicUrl }
	}

	public formatPublicUrl(key: string): string {
		const hostUrl = this.endpoint.includes('://') ? this.endpoint : 'https://' + this.endpoint
		return `${hostUrl}/${this.config.bucket}/${key}`
	}
}
