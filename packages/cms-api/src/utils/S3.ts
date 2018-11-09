import { S3 as AwsS3 } from 'aws-sdk'
import Project from '../tenant-api/Project'
import { uuid } from './uuid'
import { extension } from 'mime-types'

class S3 {
	private readonly s3: AwsS3

	constructor(private config: Project.S3Config) {
		this.s3 = new AwsS3({
			accessKeyId: config.credentials.key,
			secretAccessKey: config.credentials.secret,
			region: config.region,
		})
	}

	public getSignedUrl(contentType: string): { objectKey: string; url: string; bucket: string; publicUrl: string } {
		const ext = extension(contentType) || 'bin'
		const objectKey = `${this.config.prefix}/${uuid()}.${ext}`
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
		return `https://s3.${this.config.region}.amazonaws.com/${this.config.bucket}/${key}`
	}
}

export default S3
