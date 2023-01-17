import { extension as resolveExtension } from 'mime-types'
import { resolveS3PublicBaseUrl, S3Config } from './Config'
import { ForbiddenError, UserInputError } from '@contember/graphql-utils'
import { Providers } from '@contember/engine-plugins'
import { S3Signer } from './S3Signer'
import { S3GenerateSignedUploadInput } from './S3SchemaTypes'
import { S3ObjectAuthorizator } from './S3ObjectAuthorizator'

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

	constructor(
		public readonly config: S3Config,
		private readonly providers: Providers,
		private readonly authorizator: S3ObjectAuthorizator,
	) {
		this.publicBaseUrl = resolveS3PublicBaseUrl(config)
		this.signer = new S3Signer(config, providers)
	}

	public getSignedUploadUrl(
		{ acl, contentDisposition, contentType, expiration, prefix, suffix, fileName, extension, size }: S3GenerateSignedUploadInput,
	): SignedUploadUrl {
		const ext = extension ?? ((contentType ? resolveExtension(contentType) : null) || 'bin')
		const id = this.providers.uuid()
		const localObjectKey = (prefix ? prefix + '/' : '') + `${id}${suffix ?? ''}.${ext}`
		this.authorizator.verifyUploadAccess({ key: localObjectKey, size })

		const objectKey = (this.config.prefix ? this.config.prefix + '/' : '') + localObjectKey

		const bucket = this.config.bucket
		if (acl && this.config.noAcl) {
			throw new UserInputError('ACL is not supported')
		}

		const headers: Record<string, string> = {
			'Cache-Control': 'immutable',
		}
		if (contentType) {
			headers['Content-Type'] = contentType
		}

		if (!this.config.noAcl && acl !== 'NONE') {
			const mapping = { PUBLIC_READ: 'public-read', PRIVATE: 'private' }
			headers['x-amz-acl'] = mapping[acl ?? 'PUBLIC_READ']
		}
		if (fileName || contentDisposition) {
			let contentDispositionHeader = contentDisposition?.toLowerCase() ?? 'inline'
			if (fileName) {
				contentDispositionHeader += `; filename*=UTF-8''${encodeURIComponent(fileName)}`
			}
			headers['Content-Disposition'] = contentDispositionHeader
		}
		const headersToSend = Object.entries(headers).map(([key, value]) => ({ key, value }))

		// intentionally not sending following headers
		if (size) {
			headers['Content-Length'] = String(size)
		}

		const url = this.signer.sign({
			action: 'upload',
			expiration: expiration ?? 3600,
			key: objectKey,
			headers: { ...headers },
		})

		const publicUrl = this.formatPublicUrl(objectKey)
		return {
			bucket,
			objectKey,
			url,
			publicUrl,
			headers: headersToSend,
			method: 'PUT',
		}
	}

	public getSignedReadUrl({ objectKey, expiration }: { objectKey: string; expiration: number | null}): SignedReadUrl {
		const bucket = this.config.bucket

		const publicPrefix = this.formatPublicUrl('')
		if (objectKey.startsWith(publicPrefix)) {
			objectKey = objectKey.substring(publicPrefix.length)
		}
		if (this.config.prefix && !objectKey.startsWith(this.config.prefix)) {
			throw new ForbiddenError(
				`Given object key "${objectKey}" does not start with a project prefix "${this.config.prefix}"`,
			)
		}
		objectKey = objectKey.substring(this.config.prefix.length + 1)
		this.authorizator.verifyReadAccess({ key: objectKey })

		const url = this.signer.sign({
			action: 'read',
			expiration: expiration ?? 3600,
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
	public create(config: S3Config, providers: Providers, authorizator: S3ObjectAuthorizator) {
		return new S3Service(config, providers, authorizator)
	}
}
