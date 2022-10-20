import { extension } from 'mime-types'
import { resolveS3PublicBaseUrl, S3Config } from './Config'
import { ObjectKeyVerifier } from './ObjectKeyVerifier'
import { ForbiddenError } from '@contember/graphql-utils'
import { Providers } from '@contember/engine-plugins'
import { S3Signer } from './S3Signer'

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
	private readonly publicBaseUrl: string

	private readonly signer: S3Signer

	constructor(public readonly config: S3Config, private readonly providers: Pick<Providers, 'uuid' | 'now'>) {
		this.publicBaseUrl = resolveS3PublicBaseUrl(config)
		this.signer = new S3Signer(config, providers)
	}

	public getSignedUploadUrl(
		contentType: string,
		verifyKey: ObjectKeyVerifier,
		acl?: S3Acl,
		expiration?: number,
		prefix?: string,
	): SignedUploadUrl {
		const ext = extension(contentType) || 'bin'
		const id = this.providers.uuid()
		const localObjectKey = (prefix ? prefix + '/' : '') + `${id}.${ext}`
		verifyKey(localObjectKey)
		const objectKey = (this.config.prefix ? this.config.prefix + '/' : '') + localObjectKey

		const bucket = this.config.bucket
		if (acl && this.config.noAcl) {
			throw new Error('ACL is not supported')
		}

		const aclValue = this.config.noAcl || acl === S3Acl.None ? undefined : acl || S3Acl.PublicRead
		const url = this.signer.sign({
			action: 'upload',
			expiration: expiration || 3600,
			key: objectKey,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'immutable',
				...(aclValue ? { 'x-amz-acl': aclValue } : {}),
			},
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

	public getSignedReadUrl(objectKey: string, verifyKey: ObjectKeyVerifier, expiration?: number): SignedReadUrl {
		const bucket = this.config.bucket

		const publicPrefix = this.formatPublicUrl('')
		if (objectKey.startsWith(publicPrefix)) {
			objectKey = objectKey.substr(publicPrefix.length)
		}
		if (this.config.prefix && !objectKey.startsWith(this.config.prefix)) {
			throw new ForbiddenError(
				`Given object key "${objectKey}" does not start with a project prefix "${this.config.prefix}"`,
			)
		}
		objectKey = objectKey.substr(this.config.prefix.length + 1)
		verifyKey(objectKey)

		const url = this.signer.sign({
			action: 'read',
			expiration: expiration || 3600,
			key: objectKey,
			headers: {},
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
		return `${this.publicBaseUrl}/${key}`
	}
}

export class S3ServiceFactory {
	public create(config: S3Config, providers: Providers) {
		return new S3Service(config, providers)
	}
}
