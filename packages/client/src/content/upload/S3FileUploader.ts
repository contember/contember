import { readFileAsArrayBuffer } from '../../utils'
import { GenerateUploadUrlMutationBuilder } from './GenerateUploadUrlMutationBuilder'
import { FileUploader, FileUploaderInitializeOptions } from './FileUploader'
import { UploadedFileMetadata } from './UploadedFileMetadata'

interface S3UploadState {
	request?: XMLHttpRequest
	alias: number
}

class S3FileUploader implements FileUploader {
	private readonly uploadState: WeakMap<File, S3UploadState>

	public constructor(public readonly options: S3FileUploader.S3UploadHandlerOptions = {}) {
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
		{ client, contentApiToken, onSuccess, onError, onProgress }: FileUploaderInitializeOptions,
	) {
		if (!client) {
			return onError?.(Array.from(files).map(([file]) => [file, undefined]))
		}

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
				contentType: file.type,
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
			const response = await client.sendRequest(mutation, {}, contentApiToken)
			const responseData: GenerateUploadUrlMutationBuilder.MutationResponse = response.data

			for (const [file] of files) {
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
				})
				onError &&
					xhr.addEventListener('error', () => {
						onError([[file, undefined]])
					})
				onProgress &&
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
			}
		} catch (error) {
			onError?.(Array.from(files).map(([file]) => [file, error]))
		}
	}
}

namespace S3FileUploader {
	export interface SuccessMetadata {
		fileUrl: string
	}

	export interface S3UploadHandlerOptions {
		getUploadOptions?: (file: File) => S3UploadOptions
	}

	export interface S3UploadOptions {
		fileExpiration?: GenerateUploadUrlMutationBuilder.FileParameters['expiration']
		filePrefix?: GenerateUploadUrlMutationBuilder.FileParameters['prefix']
		fileAcl?: GenerateUploadUrlMutationBuilder.FileParameters['acl']
	}
}

export { S3FileUploader }
