import { EntityAccessor, useBindingOperations, useMutationState, VariableInputTransformer } from '@contember/binding'
import { FileUploadError } from '@contember/client'
import type {
	FileId,
	FileUpload,
	FileUploadCompoundState,
	FileWithMetadata,
	StartUploadFileOptions,
} from '@contember/react-client'
import { useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { DropzoneState, useDropzone } from 'react-dropzone'
import { assertNever } from '../../../../utils'
import type { DiscriminatedFileKind } from '../interfaces'
import { AcceptFileKindError } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { resolveAcceptingFileKind, ResolvedAcceptingFileKind, useAllAcceptedMimes } from '../utils'

export interface NormalizedUploadStateOptions {
	isMultiple: boolean
	fileKinds: ResolvedFileKinds
	prepareEntityForNewFile: (initialize: EntityAccessor.BatchUpdatesHandler) => void
	fileUpload: FileUpload
}

export interface NormalizedUploadState {
	uploadState: FileUploadCompoundState
	dropzoneState: DropzoneState
}

export const useNormalizedUploadState = ({
	fileUpload,
	isMultiple,
	fileKinds,
	prepareEntityForNewFile,
}: NormalizedUploadStateOptions): NormalizedUploadState => {
	const isMutating = useMutationState()
	const bindingOperations = useBindingOperations()
	const resolvedAccept = useAllAcceptedMimes(fileKinds)

	const [uploadState, { initializeUpload, startUpload, failUpload }] = fileUpload

	const onDrop = useCallback(
		(files: File[]) => {
			const { getEntityByKey, getEntityListSubTree, getEntitySubTree, contentClient, systemClient, tenantClient } = bindingOperations

			const idsByFile = new Map<File, FileId>()
			const filesWithIds: [FileId, File][] = []
			let metadataByFileId: Map<FileId, FileWithMetadata>
			unstable_batchedUpdates(() => {
				for (const file of files) {
					prepareEntityForNewFile(getNewAccessor => {
						const fileId = getNewAccessor().key
						filesWithIds.push([fileId, file])
						idsByFile.set(file, fileId)
					})
				}
				metadataByFileId = initializeUpload(filesWithIds)
			})

			Promise.resolve().then(async () => {
				const resolvedKindPromises: Array<Promise<ResolvedAcceptingFileKind>> = []

				for (const fileMetadata of metadataByFileId.values()) {
					resolvedKindPromises.push(
						resolveAcceptingFileKind(
							{
								file: fileMetadata.file,
								abortSignal: fileMetadata.abortController.signal,
								objectUrl: fileMetadata.previewUrl,

								getEntityByKey,
								getEntityListSubTree,
								getEntitySubTree,
								contentClient,
								systemClient,
								tenantClient,
							},
							fileKinds,
						),
					)
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
							resolved.set(resolvedKind.acceptOptions.file, {
								metadata: resolvedKind.acceptArtifacts,
								uploader: resolvedKind.fileKind.uploader,
							})

							if (fileKinds.isDiscriminated) {
								const discriminated = resolvedKind.fileKind as DiscriminatedFileKind
								const fileId = idsByFile.get(resolvedKind.acceptOptions.file)! as string
								let fileEntity = getEntityByKey(fileId)

								if (fileKinds.baseEntity !== undefined) {
									fileEntity = fileEntity.getEntity(fileKinds.baseEntity)
								}

								fileEntity
									.getField(fileKinds.discriminationField)
									.updateValue(
										VariableInputTransformer.transformValue(discriminated.discriminateBy, fileEntity.environment),
									)
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
		[initializeUpload, prepareEntityForNewFile, fileKinds, startUpload, bindingOperations, failUpload],
	)
	const dropzoneState = useDropzone({
		onDrop,
		disabled: isMutating,
		accept: resolvedAccept,
		multiple: isMultiple,
		noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
	})

	return {
		uploadState,
		dropzoneState,
	}
}
