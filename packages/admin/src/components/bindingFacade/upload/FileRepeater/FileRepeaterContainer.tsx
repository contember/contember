import {
	RemovalType,
	SugaredFieldProps,
	useDesugaredRelativeSingleField,
	useEnvironment,
	useMutationState,
	VariableInputTransformer,
} from '@contember/binding'
import { useFileUpload } from '@contember/react-client'
import { FileId } from '@contember/react-client/dist/src/upload/FileId'
import { Button, FileDropZone, FormGroup, FormGroupProps } from '@contember/ui'
import attrAccept from 'attr-accept'
import { memo, ReactNode, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { NormalizedBlocks } from '../../blocks'
import { RepeaterContainerProps, SortableRepeaterItem } from '../../collections'
import { EmptyMessage } from '../../collections/helpers'
import { SingleFileUploadProps, UploadConfigProps } from '../core'
import { CustomDataPopulatorProps, FileUrlDataPopulatorProps } from '../fileDataPopulators'
import { getGenericFileDefaults } from '../stockFileKindDefaults'
import { CustomFileKindProps } from './CustomFileKindProps'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'
import { FileRepeaterItem } from './FileRepeaterItem'

export type FileRepeaterContainerPrivateProps = CustomDataPopulatorProps &
	CustomFileKindProps &
	Partial<FileUrlDataPopulatorProps> & {
		normalizedBlocks: NormalizedBlocks
	}

export type FileRepeaterContainerPublicProps = Omit<UploadConfigProps, 'accept'> &
	SingleFileUploadProps &
	Pick<FormGroupProps, 'description' | 'labelDescription'> & {
		discriminationField?: SugaredFieldProps['field']
		removalType?: RemovalType
		addButtonSubText?: ReactNode
	}

export type FileRepeaterContainerProps = FileRepeaterContainerPublicProps &
	FileRepeaterContainerPrivateProps &
	Omit<RepeaterContainerProps, 'children'> & {
		children?: ReactNode
	}

export const FileRepeaterContainer = memo(
	({
		addButtonComponent: AddButton = Button,
		addButtonComponentExtraProps,
		addButtonProps,
		addButtonText = 'Select files to upload',
		addButtonSubText = 'or drag & drop',
		createNewEntity,
		discriminationField,
		children,
		fileDataPopulators,
		fileKinds: iterableFileKinds,
		fileUrlField,
		audioFileUrlField,
		imageFileUrlField,
		videoFileUrlField,
		normalizedBlocks,
		removalType,
		renderFile,
		renderFilePreview,
		uploader,
		emptyMessage = 'No files uploaded.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
		enableAddingNew = true,
		accessor,
		entities,
		isEmpty,
		label,
		description,
		labelDescription,
	}: FileRepeaterContainerProps) => {
		const [uploadState, { startUpload, abortUpload }] = useFileUpload()
		const isMutating = useMutationState()
		const batchUpdates = accessor.batchUpdates
		const desugaredDiscriminant = useDesugaredRelativeSingleField(discriminationField)
		const environment = useEnvironment()
		const fileKinds = useMemo(() => Array.from(iterableFileKinds), [iterableFileKinds])
		const resolvedAccept = useMemo<string[] | undefined>(() => {
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

		const onDrop = useCallback(
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

						createNewEntity(getNewAccessor => {
							filesWithIds.push([getNewAccessor().key, file])

							if (desugaredDiscriminant && acceptingFileKind && acceptingFileKind.discriminateBy !== undefined) {
								const discriminateBy = VariableInputTransformer.transformValue(
									acceptingFileKind.discriminateBy,
									environment,
								)
								getNewAccessor().getRelativeSingleField(desugaredDiscriminant).updateValue(discriminateBy)
							}
						})
					}
					startUpload(filesWithIds, {
						uploader,
					})
				})
			},
			[createNewEntity, batchUpdates, desugaredDiscriminant, environment, fileKinds, startUpload, uploader],
		)
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
			onDrop,
			disabled: isMutating && !enableAddingNew,
			accept: resolvedAccept,
			multiple: true,
			noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
		})

		const previews: ReactNode[] = []
		const genericFileDefaults = useMemo(() => getGenericFileDefaults(fileUrlField), [fileUrlField])
		const defaultFileKind: DiscriminatedFileUploadProps = {
			renderFilePreview: renderFilePreview || genericFileDefaults.renderFilePreview,
			renderFile: renderFile || genericFileDefaults.renderFile,
			accept: undefined,
		}

		for (const [i, entity] of entities.entries()) {
			const uploadingState = uploadState.get(entity.key)

			// dragHandleComponent={props.useDragHandle ? sortableHandle : undefined}
			previews.push(
				<SortableRepeaterItem index={i} key={entity.key} disabled={isMutating}>
					<FileRepeaterItem
						canBeRemoved={true}
						defaultFileKind={defaultFileKind}
						desugaredDiscriminant={desugaredDiscriminant}
						entity={entity}
						environment={environment}
						fileDataPopulators={fileDataPopulators}
						fileKinds={fileKinds}
						normalizedBlocks={normalizedBlocks}
						removalType={removalType}
						uploadingState={uploadingState}
					/>
				</SortableRepeaterItem>,
			)
		}

		return (
			<FormGroup label={label} useLabelElement={false} description={description} labelDescription={labelDescription}>
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
								{addButtonSubText && <span className="fileInput-cta-label">{addButtonSubText}</span>}
							</div>
						</FileDropZone>
					)}
				</div>
			</FormGroup>
		)
	},
)
FileRepeaterContainer.displayName = 'FileRepeaterContainer'
