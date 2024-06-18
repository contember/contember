import { UploadClient, UploadClientUploadArgs } from './UploadClient'
import { GenerateUploadUrlMutationBuilder } from '@contember/client'
import { UploaderError } from '../UploaderError'

export interface S3UploadClientOptions {
	getUploadOptions?: (file: File) => S3FileOptions
	concurrency?: number
}

export interface S3FileOptions {
	contentType?: GenerateUploadUrlMutationBuilder.FileParameters['contentType']
	expiration?: number
	size?: number
	prefix?: string
	suffix?: string
	fileName?: string
	extension?: string
	acl?: GenerateUploadUrlMutationBuilder.Acl
}

export type S3UrlSigner = (parameters: GenerateUploadUrlMutationBuilder.FileParameters) => Promise<GenerateUploadUrlMutationBuilder.ResponseBody>

export class S3UploadClient implements UploadClient<S3FileOptions> {

	private activeCount = 0
	private resolverQueue: Array<() => void> = []

	public constructor(
		private readonly s3UrlSigner: S3UrlSigner,
		public readonly options: S3UploadClientOptions = {},
	) {
	}


	public async upload({ file, signal, onProgress, ...options }: UploadClientUploadArgs & S3FileOptions) {

		const resolvedOptions = {
			...this.options.getUploadOptions?.(file),
			...options,
		}

		const parameters: GenerateUploadUrlMutationBuilder.FileParameters = {
			contentType: file.type,
			...resolvedOptions,
		}
		const responseData = await this.s3UrlSigner(parameters)
		await this.uploadSingleFile(responseData, { file, onProgress, signal })

		return {
			publicUrl: responseData.publicUrl,
		}
	}

	private async uploadSingleFile(
		signedUrl: GenerateUploadUrlMutationBuilder.ResponseBody,
		options: UploadClientUploadArgs,
	) {

		try {
			if (this.activeCount >= (this.options.concurrency ?? 5)) {
				await new Promise<void>(resolve => this.resolverQueue.push(resolve))
			}
			this.activeCount++

			await xhrAdapter(signedUrl, options)

		} finally {
			this.activeCount--
			this.resolverQueue.shift()?.()
		}
	}
}

const xhrAdapter = async (
	signedUrl: GenerateUploadUrlMutationBuilder.ResponseBody,
	{ file, signal, onProgress }: UploadClientUploadArgs,
) => {

	return await new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest()

		signal.addEventListener('abort', () => {
			xhr.abort()
		})


		xhr.open(signedUrl.method, signedUrl.url)

		for (const header of signedUrl.headers) {
			xhr.setRequestHeader(header.key, header.value)
		}

		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve()
			} else {
				reject(new UploaderError({
					type: 'httpError',
					developerMessage: `HTTP error: ${xhr.status}`,
				}))
			}
		})

		xhr.addEventListener('error', () => {
			reject(new UploaderError({
				type: 'networkError',
			}))
		})
		xhr.addEventListener('abort', () => {
			reject(new UploaderError({
				type: 'aborted',
			}))
		})
		xhr.addEventListener('timeout', () => {
			reject(new UploaderError({
				type: 'timeout',
			}))
		})

		xhr.upload?.addEventListener('progress', e => {
			onProgress({
				totalBytes: e.total,
				uploadedBytes: e.loaded,
				progress: e.loaded / e.total,
			})
		})

		xhr.send(file)
	})
}


