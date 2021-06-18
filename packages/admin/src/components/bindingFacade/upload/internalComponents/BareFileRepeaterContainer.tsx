import { Entity, useGetEntityByKey, useMutationState, VariableInputTransformer } from '@contember/binding'
import type { FileId } from '@contember/react-client'
import { FileWithMetadata, StartUploadFileOptions, useFileUpload } from '@contember/react-client'
import { returnTrue } from '@contember/react-utils'
import { Button, FileDropZone, FormGroup, FormGroupProps } from '@contember/ui'
import type { FunctionComponent } from 'react'
import { ReactNode, useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { useDropzone } from 'react-dropzone'
import { assertNever } from '../../../../utils'
import {
	EmptyMessage,
	RepeaterContainerPrivateProps,
	RepeaterContainerPublicProps,
	SortableRepeaterItem,
} from '../../collections'
import type { DiscriminatedFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { SingleFilePreview } from './SingleFilePreview'
import { resolveAcceptingFileKind, ResolvedAcceptingFileKind, useAllAcceptedMimes } from '../utils'

export interface BareFileRepeaterContainerPrivateProps {
	fileKinds: ResolvedFileKinds
}

export interface BareFileRepeaterContainerPublicProps
	extends RepeaterContainerPublicProps,
		Pick<FormGroupProps, 'description' | 'labelDescription'> {
	addButtonSubText?: ReactNode
}

export interface BareFileRepeaterContainerProps
	extends BareFileRepeaterContainerPublicProps,
		BareFileRepeaterContainerPrivateProps,
		RepeaterContainerPrivateProps {}

export const BareFileRepeaterContainer: FunctionComponent<BareFileRepeaterContainerProps> = ({
	accessor,
	entities,
	isEmpty,
	fileKinds,

	addButtonComponent: AddButton = Button,
	addButtonComponentExtraProps,
	addButtonProps,
	addButtonText = 'Select files to upload',
	addButtonSubText = 'or drag & drop',
	emptyMessage,
	emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
	emptyMessageComponentExtraProps,

	createNewEntity,

	label,
	description,
	labelDescription,

	enableAddingNew = true,
}) => {
	const [uploadState, { initializeUpload, startUpload, abortUpload }] = useFileUpload()
	const isMutating = useMutationState()
	const getEntityByKey = useGetEntityByKey()
	const resolvedAccept = useAllAcceptedMimes(fileKinds)

	const onDrop = useCallback(
		(files: File[]) => {
			const idsByFile = new Map<File, FileId>()
			const filesWithIds: [FileId, File][] = []
			let metadataByFileId: Map<FileId, FileWithMetadata>
			unstable_batchedUpdates(() => {
				for (const file of files) {
					createNewEntity(getNewAccessor => {
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
		[initializeUpload, createNewEntity, fileKinds, startUpload, getEntityByKey],
	)
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		disabled: isMutating,
		accept: resolvedAccept,
		multiple: true,
		noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
	})

	const removeFile = useCallback(
		(entityKey: FileId) => {
			getEntityByKey(entityKey.toString()).deleteEntity()
		},
		[getEntityByKey],
	)

	const previews: ReactNode[] = []
	for (const [i, entity] of entities.entries()) {
		const entityUploadState = uploadState.get(entity.key)

		// dragHandleComponent={props.useDragHandle ? sortableHandle : undefined}
		previews.push(
			<SortableRepeaterItem index={i} key={entity.key} disabled={isMutating}>
				<div className="fileInput-preview view-sortable">
					<Entity accessor={entity}>
						<SingleFilePreview
							getContainingEntity={entity.getAccessor}
							fileId={entity.key}
							hasUploadedFile={returnTrue}
							removeFile={removeFile}
							uploadState={entityUploadState}
							fileKinds={fileKinds}
						/>
					</Entity>
				</div>
			</SortableRepeaterItem>,
		)
	}

	return (
		<FormGroup label={label} useLabelElement={false} description={description} labelDescription={labelDescription}>
			<div className="fileInput">
				{isEmpty && (
					<EmptyMessageComponent {...emptyMessageComponentExtraProps}>
						{emptyMessage ?? 'No files uploaded.'}
					</EmptyMessageComponent>
				)}
				{!isEmpty && previews}
				{enableAddingNew && (
					<FileDropZone {...getRootProps()} isActive={isDragActive} className="fileInput-dropZone">
						<input {...getInputProps()} />
						<div className="fileInput-cta">
							<AddButton size="small" {...addButtonComponentExtraProps} children={addButtonText} {...addButtonProps} />
							{addButtonSubText && <span className="fileInput-cta-label">{addButtonSubText}</span>}
						</div>
					</FileDropZone>
				)}
			</div>
		</FormGroup>
	)
}
BareFileRepeaterContainer.displayName = 'BareFileRepeaterContainer'
