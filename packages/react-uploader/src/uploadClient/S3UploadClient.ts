import { FileUploadProgress, UploadClient, UploadClientUploadArgs } from './UploadClient'
import { GenerateUploadUrlMutationBuilder } from '@contember/client'
import { GraphQlClient } from '@contember/graphql-client'
import { UploaderError } from '../UploaderError'

interface S3UploadClientOptions {
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

export class S3UploadClient implements UploadClient<S3FileOptions> {

	private getSignedUploadUrl: ReturnType<typeof createBatchSignedUrlGenerator>
	private activeCount = 0
	private resolverQueue: Array<() => void> = []

	public constructor(
		contentApiClient: GraphQlClient,
		public readonly options: S3UploadClientOptions = {},
	) {
		this.getSignedUploadUrl = createBatchSignedUrlGenerator(contentApiClient)
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
		const responseData = await this.getSignedUploadUrl(parameters)
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

			const uploadAdapter = signedUrl.url.startsWith('https://') ? fetchAdapter : xhrAdapter

			await uploadAdapter(signedUrl, options)

		} finally {
			this.activeCount--
			this.resolverQueue.shift()?.()
		}
	}
}

const fetchAdapter = async (
	signedUrl: GenerateUploadUrlMutationBuilder.ResponseBody,
	{ file, signal, onProgress }: UploadClientUploadArgs,
) => {
	const stream = createFileStream(file, progress => {
		onProgress(progress)
	})

	try {
		const response = await fetch(signedUrl.url, {
			method: signedUrl.method,
			signal: signal,
			body: stream,
			headers: Object.fromEntries(signedUrl.headers.map(({ key, value }) => [key, value])),
			...({
				duplex: 'half',
			}),
		})
		if (!response.ok) {
			throw new UploaderError({
				type: 'httpError',
			})
		}
	} catch (e: any) {
		if (e instanceof UploaderError) {
			throw e
		}
		if (e.name === 'AbortError') {
			throw new UploaderError({
				type: 'aborted',
			})
		}
		throw new UploaderError({
			type: 'networkError',
		})
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


const createBatchSignedUrlGenerator = (client: GraphQlClient) => {

	let uploadUrlBatchParameters: GenerateUploadUrlMutationBuilder.FileParameters[] = []
	let uploadUrlBatchResult: null | Promise<GenerateUploadUrlMutationBuilder.MutationResponse> = null

	return async (parameters: GenerateUploadUrlMutationBuilder.FileParameters): Promise<GenerateUploadUrlMutationBuilder.ResponseBody> => {
		const index = uploadUrlBatchParameters.length
		uploadUrlBatchParameters.push(parameters)
		if (uploadUrlBatchResult === null) {
			uploadUrlBatchResult = (async () => {
				await new Promise(resolve => setTimeout(resolve, 0))

				const mutation = GenerateUploadUrlMutationBuilder.buildQuery(Object.fromEntries(uploadUrlBatchParameters.map((_, i) => ['url_' + i, _])))
				const response = await client.execute<GenerateUploadUrlMutationBuilder.MutationResponse>(mutation.query, { variables: mutation.variables })
				uploadUrlBatchParameters = []
				uploadUrlBatchResult = null
				return response
			})()
		}
		return (await uploadUrlBatchResult)[`url_${index}`]
	}
}

const createFileStream = (file: File, onProgress: (progress: FileUploadProgress) => void) => {
	const totalSize = file.size
	let uploadedSize = 0
	return new ReadableStream({
		start(controller) {
			const reader = file.stream().getReader()
			read()

			function read() {
				reader.read().then(({ done, value }) => {
					if (done) {
						controller.close()
						return
					}
					controller.enqueue(value)
					uploadedSize += value.byteLength
					onProgress({
						progress: uploadedSize / totalSize,
						uploadedBytes: uploadedSize,
						totalBytes: totalSize,
					})
					read()
				}).catch(error => {
					controller.error(error)
				})
			}
		},
	})
}
