import { readFileAsArrayBuffer } from '../../utils'
import type { FileUploader, FileUploaderInitializeOptions } from './FileUploader'
import { GenerateUploadUrlMutationBuilder } from './GenerateUploadUrlMutationBuilder'
import type { UploadedFileMetadata } from './UploadedFileMetadata'
import { FileUploadError } from './FileUploadError'
import pLimit from 'p-limit'

interface S3UploadState {
	request?: XMLHttpRequest
	alias: number
}

class S3FileUploader implements FileUploader<S3FileUploader.SuccessMetadata> {
	private readonly uploadState: WeakMap<File, S3UploadState>

	public constructor(public readonly options: S3FileUploader.Options = {}) {
		this.uploadState = new WeakMap()
	}

	private generateNewAlias = (() => {
		let alias = 1
		return () => alias++
	})()

	private static formatFullAlias(alias: number) {
		return `file${alias}`
	}

	public async upload(
		files: Map<File, UploadedFileMetadata>,
		options: FileUploaderInitializeOptions,
	) {
		const parameters: GenerateUploadUrlMutationBuilder.MutationParameters = {}

		for (const [file, metadata] of files) {
			if (this.uploadState.has(file)) {
				const uploadState = this.uploadState.get(file)!
				uploadState.request?.abort()
			}

			const alias = this.generateNewAlias()
			this.uploadState.set(file, {
				alias,
			})

			const uploadOptions = this.options.getUploadOptions?.(file)

			parameters[S3FileUploader.formatFullAlias(alias)] = {
				contentType: uploadOptions?.fileType ?? file.type,
				prefix: uploadOptions?.filePrefix,
				expiration: uploadOptions?.fileExpiration,
				acl: uploadOptions?.fileAcl,
			}

			metadata.abortSignal.addEventListener('abort', () => {
				this.uploadState.get(file)?.request?.abort()
			})
		}

		const mutation = GenerateUploadUrlMutationBuilder.buildQuery(parameters)
		try {
			const response = await options.contentApiClient.sendRequest(mutation)
			const responseData: GenerateUploadUrlMutationBuilder.MutationResponse = response.data
			const limit = pLimit(this.options.concurrency ?? 5)
			const promises: Promise<void>[] = []
			for (const [file] of files) {
				promises.push(limit(() => this.uploadSingleFile(file, responseData, options)))
			}
			await Promise.all(promises)
		} catch (error) {
			if (error instanceof FileUploadError) {
				const fileUploadError = error
				options.onError(Array.from(files).map(([file]) => [file, fileUploadError]))

			} else {
				throw error
			}
		}
	}

	private uploadSingleFile(
		file: File,
		responseData: GenerateUploadUrlMutationBuilder.MutationResponse,
		{ onProgress, onError, onSuccess }: FileUploaderInitializeOptions,
	) {
		return new Promise<void>(async (resolve, reject) => {
			const fileState = this.uploadState.get(file)!
			const datumBody = responseData[S3FileUploader.formatFullAlias(fileState.alias)]
			const uploadRequestBody = await readFileAsArrayBuffer(file)
			const xhr = new XMLHttpRequest()

			fileState.request = xhr

			xhr.open(datumBody.method, datumBody.url)

			for (const header of datumBody.headers) {
				xhr.setRequestHeader(header.key, header.value)
			}
			xhr.addEventListener('load', () => {
				const successMetadata: S3FileUploader.SuccessMetadata = {
					fileUrl: datumBody.publicUrl,
				}
				onSuccess([[file, successMetadata]])
				resolve()
			})
			xhr.addEventListener('error', e => {
				onError([file])
				reject(e)
			})
			 xhr.upload?.addEventListener('progress', e => {
				onProgress([
					[
						file,
						{
							progress: e.loaded / e.total,
						},
					],
				])
			})
			xhr.send(uploadRequestBody)
		})
	}
}

namespace S3FileUploader {
	export interface SuccessMetadata {
		fileUrl: string
	}

	export interface Options {
		getUploadOptions?: (file: File) => S3UploadOptions
		concurrency?: number
	}

	export interface S3UploadOptions {
		fileType?: GenerateUploadUrlMutationBuilder.FileParameters['contentType']
		fileExpiration?: GenerateUploadUrlMutationBuilder.FileParameters['expiration']
		filePrefix?: GenerateUploadUrlMutationBuilder.FileParameters['prefix']
		fileAcl?: GenerateUploadUrlMutationBuilder.FileParameters['acl']
	}
}

export { S3FileUploader }
