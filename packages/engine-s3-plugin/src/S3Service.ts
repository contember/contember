import { extension as resolveExtension } from 'mime-types'
import { resolveS3PublicBaseUrl, S3Config } from './Config.js'
import { ForbiddenError, UserInputError } from '@contember/graphql-utils'
import { Providers } from '@contember/engine-plugins'
import { S3Signer } from './S3Signer.js'
import { S3GenerateSignedUploadInput } from './S3SchemaTypes.js'
import { S3ObjectAuthorizator } from './S3ObjectAuthorizator.js'

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

type DeletedObject = {
	bucket: string
	objectKey: string
}

export type S3FetchResponse = {
	readonly ok: boolean
	readonly status: number
	text(): Promise<string>
}

export type S3Fetch = (url: string, init: { method: string; signal: AbortSignal }) => Promise<S3FetchResponse>

const deleteUrlExpiration = 60
const deleteTimeoutMs = 10_000

export class S3Service {
	private readonly publicBaseUrl: string

	private readonly signer: S3Signer

	constructor(
		public readonly config: S3Config,
		private readonly providers: Pick<Providers, 'uuid' | 'now'>,
		private readonly authorizator: S3ObjectAuthorizator,
		private readonly fetch: S3Fetch = (url, init) => globalThis.fetch(url, init),
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

	public getSignedReadUrl({ objectKey, expiration }: { objectKey: string; expiration: number | null }): SignedReadUrl {
		const bucket = this.config.bucket
		const resolved = this.resolveObjectKey(objectKey)
		this.authorizator.verifyReadAccess({ key: resolved.localObjectKey })

		const url = this.signer.sign({
			action: 'read',
			expiration: expiration ?? 3600,
			key: resolved.objectKey,
			headers: {},
		})

		return {
			bucket,
			objectKey: resolved.objectKey,
			url,
			headers: [],
			method: 'GET',
		}
	}

	/**
	 * Unlike an upload or a read, a delete carries no payload, so the signed URL never leaves the server.
	 */
	public async deleteObject({ objectKey }: { objectKey: string }): Promise<DeletedObject> {
		const bucket = this.config.bucket
		const resolved = this.resolveObjectKey(objectKey)
		this.authorizator.verifyDeleteAccess({ key: resolved.localObjectKey })

		const url = this.signer.sign({
			action: 'delete',
			expiration: deleteUrlExpiration,
			key: resolved.objectKey,
			headers: {},
		})

		const response = await this.fetch(url, { method: 'DELETE', signal: AbortSignal.timeout(deleteTimeoutMs) })
		if (!response.ok) {
			throw new Error(`Failed to delete an object "${resolved.objectKey}": S3 responded with ${response.status}: ${await response.text()}`)
		}

		return {
			bucket,
			objectKey: resolved.objectKey,
		}
	}

	public formatPublicUrl(key: string): string {
		return `${this.publicBaseUrl}/${key}`
	}

	private resolveObjectKey(objectKey: string): { objectKey: string; localObjectKey: string } {
		const publicPrefix = this.formatPublicUrl('')
		if (objectKey.startsWith(publicPrefix)) {
			objectKey = objectKey.substring(publicPrefix.length)
		}
		// the separator is a part of the prefix: without it, a project prefixed "blog" reaches into "blog-staging" in a shared bucket
		const prefix = this.config.prefix ? this.config.prefix + '/' : ''
		if (prefix && !objectKey.startsWith(prefix)) {
			throw new ForbiddenError(
				`Given object key "${objectKey}" does not start with a project prefix "${this.config.prefix}"`,
			)
		}
		const localObjectKey = objectKey.substring(prefix.length)

		return { objectKey, localObjectKey }
	}
}

export class S3ServiceFactory {
	public create(config: S3Config, providers: Providers, authorizator: S3ObjectAuthorizator) {
		return new S3Service(config, providers, authorizator)
	}
}
