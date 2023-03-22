import { AcceptFileKindError, AcceptedFile, FileHandler } from '../../fileHandler'
import * as dropzone from 'react-dropzone'
import type { DropzoneState } from 'react-dropzone'
import { EntityAccessor, useBindingOperations, useMutationState } from '@contember/binding'
import type {
	FileId,
	FileUpload,
	FileUploadCompoundState,
	FileWithMetadata,
	StartUploadFileOptions,
} from '@contember/react-client'

import { FileUploadError } from '@contember/client'
import { assertNever } from '../../../../../utils'
import { unstable_batchedUpdates } from 'react-dom'
import { useCallback } from 'react'

export interface NormalizedUploadStateOptions {
	isMultiple: boolean
	fileHandler: FileHandler,
	prepareEntityForNewFile: (initialize: EntityAccessor.BatchUpdatesHandler) => void
	fileUpload: FileUpload
}

export interface NormalizedUploadState {
	uploadState: FileUploadCompoundState
	dropzoneState: DropzoneState
}

const { useDropzone } = dropzone

export const useNormalizedUploadState = ({
	fileUpload,
	isMultiple,
	fileHandler,
	prepareEntityForNewFile,
}: NormalizedUploadStateOptions): NormalizedUploadState => {
	const isMutating = useMutationState()
	const bindingOperations = useBindingOperations()

	const [uploadState, { initializeUpload, startUpload, failUpload }] = fileUpload

	const onDrop = useCallback(
		(files: File[]) => {
			const { getEntityByKey, getEntityListSubTree, getEntitySubTree, contentClient, systemClient, tenantClient } = bindingOperations

			const filesWithIds: [string, File][] = []
			let metadataByFileId: Map<FileId, FileWithMetadata>
			unstable_batchedUpdates(() => {
				for (const file of files) {
					prepareEntityForNewFile(getNewAccessor => {
						const fileId = getNewAccessor().key
						filesWithIds.push([fileId, file])
					})
				}
				metadataByFileId = initializeUpload(filesWithIds)
			})

			Promise.resolve().then(async () => {
				const resolvedKindPromises: Array<Promise<AcceptedFile | undefined>> = []

				for (const fileMetadata of metadataByFileId.values()) {
					resolvedKindPromises.push(fileHandler.acceptFile({
						file: fileMetadata.file,
						abortSignal: fileMetadata.abortController.signal,
						objectUrl: fileMetadata.previewUrl,

						getEntityByKey,
						getEntityListSubTree,
						getEntitySubTree,
						contentClient,
						systemClient,
						tenantClient,
					}))
				}

				// We deliberately group all files at this stage. That way by the time we actually start uploading, all file
				// kinds will have been resolved. That, in turn, allows us to re-use their uploaders and upload in bulk.
				// That is not always optimal but generally, the file kind resolution is expected to be much faster than
				// network operations.
				// TODO timeout or something
				const resolvedFileKinds = await Promise.allSettled(resolvedKindPromises)

				unstable_batchedUpdates(() => {
					const resolved = new Map<File, StartUploadFileOptions>()
					const rejected: Array<File | [File, FileUploadError[]]> = []

					for (const [i, result] of resolvedFileKinds.entries()) {
						if (result.status === 'fulfilled') {
							const resolvedKind = result.value
							if (resolvedKind === undefined) {
								rejected.push(files[i])
								continue
							}
							resolved.set(files[i], {
								uploader: resolvedKind.fileKind.uploader,
							})
							if (resolvedKind.finalizeEntity) {
								const fileId = filesWithIds[i][0]
								const fileEntity = getEntityByKey(fileId)
								resolvedKind.finalizeEntity(fileEntity)
							}
						} else if (result.status === 'rejected') {
							const errors: FileUploadError[] = []
							const e = result.reason

							if (e instanceof AcceptFileKindError) {
								errors.push(new FileUploadError(e.options))
							} else if (e instanceof AggregateError) {
								for (const error of e.errors) {
									if (error instanceof AcceptFileKindError) {
										errors.push(new FileUploadError(error.options))
									}
								}
							}

							const file = files[i]
							if (errors.length) {
								rejected.push([file, errors])
							} else {
								rejected.push(file)
							}
						} else {
							assertNever(result)
						}
					}

					if (rejected.length) {
						failUpload(rejected)
					}
					startUpload(resolved)
				})
			})
		},
		[bindingOperations, initializeUpload, prepareEntityForNewFile, fileHandler, startUpload, failUpload],
	)
	const dropzoneState = useDropzone({
		onDrop,
		disabled: isMutating,
		accept: fileHandler.acceptedMimes ?? undefined,
		multiple: isMultiple,
		noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
	})

	return {
		uploadState,
		dropzoneState,
	}
}
