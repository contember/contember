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
		})
	}

	public getSignedUrl(contentType: string): string {
		const ext = extension(contentType) || 'bin'
		return this.s3.getSignedUrl('putObject', {
			Bucket: this.config.bucket,
			Key: `${this.config.prefix}/${uuid()}.${ext}`,
			ContentType: contentType,
			CacheControl: 'immutable',
			Expires: 3600,
			ACL: 'public-read',
		})
	}
}

export default S3
