import { EntityAccessor, useGetEntityByKey, useMutationState, VariableInputTransformer } from '@contember/binding'
import { FileId, FileUpload, FileWithMetadata, StartUploadFileOptions, useFileUpload } from '@contember/react-client'
import { useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { DropzoneState, useDropzone } from 'react-dropzone'
import { assertNever } from '../../../../utils'
import type { DiscriminatedFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { resolveAcceptingFileKind, ResolvedAcceptingFileKind, useAllAcceptedMimes } from '../utils'

export interface NormalizedUploadStateOptions {
	isMultiple: boolean
	fileKinds: ResolvedFileKinds
	prepareEntityForNewFile: (initialize: (getNewEntity: EntityAccessor.GetEntityAccessor) => void) => void
}

export interface NormalizedUploadState {
	fileUpload: FileUpload
	dropzoneState: DropzoneState
}

export const useNormalizedUploadState = ({
	isMultiple,
	fileKinds,
	prepareEntityForNewFile,
}: NormalizedUploadStateOptions): NormalizedUploadState => {
	const fileUpload = useFileUpload()
	const isMutating = useMutationState()
	const getEntityByKey = useGetEntityByKey()
	const resolvedAccept = useAllAcceptedMimes(fileKinds)

	const [uploadState, { initializeUpload, startUpload, abortUpload }] = fileUpload

	const onDrop = useCallback(
		(files: File[]) => {
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
				const rejected: unknown[] = []

				for (const fileMetadata of metadataByFileId.values()) {
					try {
						resolvedKindPromises.push(
							resolveAcceptingFileKind(
								{
									file: fileMetadata.file,
									abortSignal: fileMetadata.abortController.signal,
									objectUrl: fileMetadata.previewUrl,
								},
								fileKinds,
							),
						)
					} catch (e) {
						rejected.push(e)
					}
				}

				// We deliberately group all files at this stage. That way by the time we actually start uploading, all file
				// kinds will have been resolved. That, in turn, allows us to re-use their uploaders and upload in bulk.
				// That is not always optimal but generally, the file kind resolution is expected to be much faster than
				// network operations.
				// TODO timeout or something
				const resolvedFileKinds = await Promise.allSettled(resolvedKindPromises)

				unstable_batchedUpdates(() => {
					const resolved = new Map<File, StartUploadFileOptions>()

					for (const result of resolvedFileKinds) {
						if (result.status === 'fulfilled') {
							const resolvedKind = result.value
							resolved.set(resolvedKind.acceptOptions.file, {
								metadata: resolvedKind.acceptArtifacts,
								uploader: resolvedKind.fileKind.uploader,
							})

							if (fileKinds.isDiscriminated) {
								const discriminated = resolvedKind.fileKind as DiscriminatedFileKind
								const fileId = idsByFile.get(resolvedKind.acceptOptions.file)! as string
								const fileEntity = getEntityByKey(fileId)

								fileEntity
									.getField(fileKinds.discriminationField)
									.updateValue(
										VariableInputTransformer.transformValue(discriminated.discriminateBy, fileEntity.environment),
									)
							}
						} else if (result.status === 'rejected') {
							rejected.push(result.reason)
						} else {
							assertNever(result)
						}
					}

					if (rejected.length) {
						// TODO
					}
					startUpload(resolved)
				})
			})
		},
		[initializeUpload, prepareEntityForNewFile, fileKinds, startUpload, getEntityByKey],
	)
	const dropzoneState = useDropzone({
		onDrop,
		disabled: isMutating,
		accept: resolvedAccept,
		multiple: isMultiple,
		noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
	})

	return {
		dropzoneState,
		fileUpload,
	}
}
