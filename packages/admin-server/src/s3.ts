import {
	GetObjectCommand,
	GetObjectCommandOutput,
	ListObjectsV2Command,
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3'
import * as Buffer from 'buffer'
import * as mime from 'mime'

export class S3Manager {
	constructor(private s3: S3Client, private s3Bucket: string, private s3Prefix: string) {}

	async getObject(projectSlug: string, path: string): Promise<GetObjectCommandOutput> {
		try {
			return this.s3.send(
				new GetObjectCommand({
					Bucket: this.s3Bucket,
					Key: this.formatKey(projectSlug, path),
				}),
			)

		} catch (e) {
			return this.s3.send(
				new GetObjectCommand({
					Bucket: this.s3Bucket,
					Key: this.formatKey(projectSlug, ''),
				}),
			)
		}
	}

	async putObject(projectSlug: string, path: string, body: Buffer): Promise<PutObjectCommandOutput> {
		return await this.s3.send(
			new PutObjectCommand({
				Bucket: this.s3Bucket,
				Key: this.formatKey(projectSlug, path),
				Body: body,
				ContentType: mime.getType(path) ?? 'application/octet-stream',
				ACL: 'private',
			}),
		)
	}

	async listProjectSlugs(): Promise<string[]> {
		const response = await this.s3.send(
			new ListObjectsV2Command({
				Bucket: this.s3Bucket,
				Prefix: this.s3Prefix,
				Delimiter: '/',
			}),
		)

		return (response.CommonPrefixes ?? []).map(it => it.Prefix!.substring(this.s3Prefix.length, it.Prefix!.length - 1))
	}

	private formatKey(projectSlug: string, path: string) {
		return this.s3Prefix + projectSlug + '/' + (path === '' ? 'index.html' : path)
	}
}
