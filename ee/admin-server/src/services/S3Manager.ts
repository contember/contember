import {
	GetObjectCommand,
	GetObjectCommandOutput,
	ListObjectsV2Command,
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3'
import type * as Buffer from 'buffer'
import mime from 'mime'
import { S3LocationResolver } from './S3LocationResolver'
import { Readable } from 'stream'
import { readReadable } from '../utils/readReadable'

export class S3Manager {
	constructor(
		private s3: S3Client,
		private s3LocationResolver: S3LocationResolver,
	) {
	}

	async getObject({ project, projectGroup, path }: {
		project?: string,
		projectGroup?: string,
		path: string,
	}): Promise<GetObjectCommandOutput> {
		const { bucket, prefix } = this.s3LocationResolver.resolve(project, projectGroup)
		return this.s3.send(
			new GetObjectCommand({
				Bucket: bucket,
				Key: `${prefix}${path}`,
			}),
		)
	}

	async getObjectContent(...args: Parameters<S3Manager['getObject']>): Promise<string> {
		const object = await this.getObject(...args)
		const body = object.Body
		if (!(body instanceof Readable)) {
			throw new Error('Invalid S3 response')
		}
		return readReadable(body)
	}

	async putObject({ project, projectGroup, path, body }: {
		project: string,
		projectGroup?: string,
		path: string,
		body: Buffer,
	}): Promise<PutObjectCommandOutput> {
		const { bucket, prefix } = this.s3LocationResolver.resolve(project, projectGroup)
		return await this.s3.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: `${prefix}${path}`,
				Body: body,
				ContentType: mime.getType(path) ?? 'application/octet-stream',
				ACL: 'private',
			}),
		)
	}

	async listProjectSlugs({ projectGroup }: {
		projectGroup?: string,
	}): Promise<string[]> {
		const { bucket, prefix } = this.s3LocationResolver.resolve(undefined, projectGroup)
		const response = await this.s3.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				Delimiter: '/',
			}),
		)

		return (response.CommonPrefixes ?? []).map(it => it.Prefix!.substring(prefix.length, it.Prefix!.length - 1))
	}
}
