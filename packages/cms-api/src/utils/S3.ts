import { S3 as AwsS3 } from 'aws-sdk'
import Project from '../config/Project'
import { uuid } from './uuid'
import { extension } from 'mime-types'

class S3 {
	private readonly s3: AwsS3

	private readonly endpoint: string

	constructor(private config: Project.S3Config) {
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
		const objectKey = (this.config.prefix ? this.config.prefix + '/' : '') + `${uuid()}.${ext}`
		const bucket = this.config.bucket
		const url = this.s3.getSignedUrl('putObject', {
			Bucket: bucket,
			Key: objectKey,
			ContentType: contentType,
			CacheControl: 'immutable',
			Expires: 3600,
			ACL: 'public-read',
		})
		const publicUrl = this.formatPublicUrl(objectKey)
		return { bucket, objectKey, url, publicUrl }
	}

	public formatPublicUrl(key: string): string {
		return `https://${this.endpoint}/${this.config.bucket}/${key}`
	}
}

export default S3
