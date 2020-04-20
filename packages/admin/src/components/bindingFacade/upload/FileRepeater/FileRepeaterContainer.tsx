import {
	Entity,
	EntityAccessor,
	SugaredFieldProps,
	useEnvironment,
	useMutationState,
	useOptionalDesugaredRelativeSingleField,
	VariableInputTransformer,
} from '@contember/binding'
import { useFileUpload } from '@contember/react-client'
import { FileId } from '@contember/react-client/dist/src/upload/FileId'
import { ActionableBox, Box, Button, FileDropZone, FormGroup, Icon } from '@contember/ui'
import attrAccept from 'attr-accept'
import * as React from 'react'
import { DropEvent, useDropzone } from 'react-dropzone'
import { RepeaterContainerProps, SortableRepeaterItem, SortableRepeaterItemHandle } from '../../collections'
import { EmptyMessage } from '../../collections/helpers'
import { SingleFileUploadProps, UploadConfigProps } from '../core'
import { UploadedFilePreview } from '../core/UploadedFilePreview'
import { UploadingFilePreview } from '../core/UploadingFilePreview'
import { CustomDataPopulatorProps, FileUrlDataPopulatorProps } from '../fileDataPopulators'
import { getGenericFileDefaults } from '../stockFileKindDefaults'
import { CustomFileKindProps } from './CustomFileKindProps'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'

export type FileRepeaterContainerPrivateProps = CustomDataPopulatorProps &
	CustomFileKindProps &
	Partial<FileUrlDataPopulatorProps>

export type FileRepeaterContainerPublicProps = Omit<UploadConfigProps, 'accept'> &
	SingleFileUploadProps & {
		discriminationField?: SugaredFieldProps['field']
	}

export type FileRepeaterContainerProps = FileRepeaterContainerPublicProps &
	FileRepeaterContainerPrivateProps &
	Omit<RepeaterContainerProps, 'children'> & {
		children?: React.ReactNode
	}

export const FileRepeaterContainer = React.memo(
	({
		addButtonComponent: AddButton = Button,
		addButtonComponentExtraProps,
		addButtonProps,
		addButtonText = 'Select files to upload',
		addNew,
		discriminationField,
		children,
		fileDataPopulators,
		fileKinds: iterableFileKinds,
		fileUrlField,
		audioFileUrlField,
		imageFileUrlField,
		videoFileUrlField,
		renderFile,
		renderFilePreview,
		uploader,
		emptyMessage = 'No files uploaded.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
		enableAddingNew = true,
		entityList,
		entities,
		isEmpty,
		label,
	}: FileRepeaterContainerProps) => {
		const [uploadState, { startUpload, abortUpload }] = useFileUpload()
		const isMutating = useMutationState()
		const batchUpdates = entityList.batchUpdates
		const desugaredDiscriminant = useOptionalDesugaredRelativeSingleField(discriminationField)
		const environment = useEnvironment()
		const fileKinds = React.useMemo(() => Array.from(iterableFileKinds), [iterableFileKinds])
		const resolvedAccept = React.useMemo<string[] | undefined>(() => {
			const resolved = fileKinds.flatMap(fileKind => {
				if (fileKind.accept === undefined) {
					return []
				}
				if (Array.isArray(fileKind.accept)) {
					return fileKind.accept
				}
				return [fileKind.accept]
			})
			if (resolved.length === 0) {
				return undefined
			}
			return resolved
		}, [fileKinds])

		const onDrop = React.useCallback(
			(files: File[]) => {
				const filesWithIds: [FileId, File][] = []
				batchUpdates(getListAccessor => {
					for (const file of files) {
						let acceptingFileKind: DiscriminatedFileUploadProps | undefined = undefined
						if (desugaredDiscriminant) {
							acceptingFileKind = fileKinds.find(
								fileKind => fileKind.accept === undefined || attrAccept(file, fileKind.accept),
							)
						}

						if (!acceptingFileKind && fileKinds.length > 1) {
							// We haven't found an accepting file kind but there were more kinds to choose from. If there hadn't been,
							// we would have proceeded since that would imply that we're not interested in discriminating between
							// file kinds. But given the kind count, we are but for this particular file we have no candidate value
							// for the discriminant field.
							// TODO let the user know as opposed to just silently leaving the file out.
							continue
						}

						addNew((getAccessor, newKey) => {
							filesWithIds.push([newKey, file])

							if (
								desugaredDiscriminant &&
								acceptingFileKind &&
								(acceptingFileKind.discriminateBy !== undefined || acceptingFileKind.discriminateByScalar !== undefined)
							) {
								const discriminateBy =
									acceptingFileKind.discriminateByScalar ??
									VariableInputTransformer.transformVariableLiteral(acceptingFileKind.discriminateBy!, environment)
								;(getAccessor().getByKey(newKey) as EntityAccessor)
									.getRelativeSingleField(desugaredDiscriminant)
									.updateValue?.(discriminateBy)
							}
						})
					}
					startUpload(filesWithIds, {
						uploader,
					})
				})
			},
			[addNew, batchUpdates, desugaredDiscriminant, environment, fileKinds, startUpload, uploader],
		)
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
			onDrop,
			disabled: isMutating && !enableAddingNew,
			accept: resolvedAccept,
			multiple: true,
			noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
		})

		const previews: React.ReactNode[] = []
		const genericFileDefaults = React.useMemo(() => getGenericFileDefaults(fileUrlField), [fileUrlField])
		const defaultFileKind: DiscriminatedFileUploadProps = {
			renderFilePreview: renderFilePreview || genericFileDefaults.renderFilePreview,
			renderFile: renderFile || genericFileDefaults.renderFile,
			accept: undefined,
		}

		for (const [i, entity] of entities.entries()) {
			const uploadingState = uploadState.get(entity.key)
			let resolvedFileKind: Partial<DiscriminatedFileUploadProps> = defaultFileKind

			if (desugaredDiscriminant) {
				const discriminantField = entity.getRelativeSingleField(desugaredDiscriminant)
				const acceptingFileKind: DiscriminatedFileUploadProps | undefined = fileKinds.find(
					fileKind =>
						(fileKind.discriminateBy !== undefined &&
							discriminantField.hasValue(
								VariableInputTransformer.transformVariableLiteral(fileKind.discriminateBy, environment),
							)) ||
						(fileKind.discriminateByScalar !== undefined && discriminantField.hasValue(fileKind.discriminateByScalar)),
				)
				if (acceptingFileKind) {
					resolvedFileKind = acceptingFileKind
				}
			}

			const preview = uploadingState ? (
				<UploadingFilePreview
					uploadState={uploadingState}
					batchUpdates={entity.batchUpdates}
					renderFilePreview={resolvedFileKind.renderFilePreview || defaultFileKind.renderFilePreview}
					environment={environment}
					populators={fileDataPopulators}
				/>
			) : (
				<UploadedFilePreview renderFile={resolvedFileKind.renderFile || defaultFileKind.renderFile} />
			)

			// removalType={props.removalType}
			// canBeRemoved={itemRemovingEnabled}
			// dragHandleComponent={props.useDragHandle ? sortableHandle : undefined}
			previews.push(
				<SortableRepeaterItem index={i} key={entity.key} disabled={isMutating}>
					<div className="fileInput-preview">
						<Entity accessor={entity}>
							<ActionableBox
								onRemove={e => {
									e.stopPropagation()
									entity.remove?.('delete') // TODO
								}}
							>
								{preview}
							</ActionableBox>
						</Entity>
					</div>
				</SortableRepeaterItem>,
			)
		}

		return (
			<FormGroup label={label}>
				<div className="fileInput">
					{isEmpty && (
						<EmptyMessageComponent {...emptyMessageComponentExtraProps}>{emptyMessage}</EmptyMessageComponent>
					)}
					{!isEmpty && previews}
					{enableAddingNew && (
						<FileDropZone {...getRootProps()} isActive={isDragActive} className="fileInput-dropZone">
							<input {...getInputProps()} />
							<div className="fileInput-cta">
								<AddButton
									size="small"
									{...addButtonComponentExtraProps}
									children={addButtonText}
									{...addButtonProps}
								/>
								<span className="fileInput-cta-label">or drag & drop</span>
							</div>
						</FileDropZone>
					)}
				</div>
			</FormGroup>
		)
	},
)
FileRepeaterContainer.displayName = 'FileRepeaterContainer'
