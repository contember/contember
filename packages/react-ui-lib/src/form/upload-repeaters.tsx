import {
	AnyFileTypeProps,
	AudioFileTypeProps,
	createAnyFileType,
	createAudioFileType,
	createImageFileType,
	createVideoFileType,
	FileType,
	FileWithMeta,
	ImageFileTypeProps,
	MultiUploader, S3FileOptions,
	UploaderBaseFieldProps,
	UploaderHasFile,
	useMultiUploaderFileState,
	useS3Client,
	VideoFileTypeProps,
} from '@contember/react-uploader'
import * as React from 'react'
import { ReactNode, useMemo, useState } from 'react'
import { FormContainer, FormContainerProps } from './container'
import { Component, useEntity } from '@contember/interface'
import { FormFieldStateProvider } from '@contember/react-form'
import {
	UploadedAnyView,
	UploadedAudioView,
	UploadedImageView,
	UploadedVideoView,
	UploaderDropzone,
	UploaderRepeaterDragOverlayUI,
	UploaderRepeaterHandleUI,
	UploaderRepeaterItemsWrapperUI,
	UploaderRepeaterItemUI,
} from '../upload'
import { UploaderProgress } from '../upload/upload-progress'
import { Repeater, RepeaterProps, RepeaterRemoveItemTrigger } from '@contember/react-repeater'
import {
	RepeaterSortable,
	RepeaterSortableDragOverlay,
	RepeaterSortableEachItem,
	RepeaterSortableItemActivator,
	RepeaterSortableItemNode,
} from '@contember/react-repeater-dnd-kit'
import { UploaderRepeaterDropIndicator } from '../upload/repeater'
import { Loader } from '../ui/loader'


export type BaseFileRepeaterFieldProps =
	& Omit<FormContainerProps, 'children'>
	& RepeaterProps
	& UploaderBaseFieldProps
	& {
		dropzonePlaceholder?: ReactNode
		actions?: ReactNode
		edit?: ReactNode
		noDestroy?: boolean
		getUploadOptions?: (file: File) => S3FileOptions
	}

export type ImageRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& ImageFileTypeProps

/**
 * ImageRepeaterField component - Multiple image upload with sorting capabilities
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles multiple image uploads in a list format
 * - Drag-and-drop reordering of images
 * - Auto-generated image previews
 * - Progress indicators during upload
 * - Integrated removal controls
 *
 * #### Example: Basic usage
 * ```tsx
 * <ImageRepeaterField
 *   label="Gallery Images"
 *   field="images"
 *   urlField="image.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: With custom dropzone and actions
 * ```tsx
 * <ImageRepeaterField
 *   field="imageList.items"
 *   baseField="image"
 *   sortableBy="order"
 *   urlField="url"
 *   widthField="width"
 *   heightField="height"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Image file"
 *   description="Some description of the image file."
 *   dropzonePlaceholder={(
 *     <UploaderDropzoneAreaUI className="w-60">
 *       <UploadIcon className="w-12 h-12 text-gray-400" />
 *       <div className="font-semibold text-sm">Drop files here</div>
 *       <div className="text-xs">or</div>
 *       <div className="flex gap-2 items-center text-xs">
 *         <Button size="sm" variant="outline">Browse</Button>
 *         <div onClick={e => e.stopPropagation()}>
 *           <SelectImageRepeater />
 *         </div>
 *       </div>
 *     </UploaderDropzoneAreaUI>
 *   )}
 * />
 * ```
 */
export const ImageRepeaterField = Component<ImageRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createImageFileType(props)} renderPreview={file => {
		return <div className="flex items-center justify-center h-40 rounded-md group relative">
			<img src={file.file.previewUrl} className="max-w-full max-h-full" />
		</div>
	}}>
		{props.children ?? (
			<UploadedImageView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
		)}
	</FileRepeaterFieldInner>
</>)


export type AudioRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& AudioFileTypeProps

/**
 * AudioRepeaterField component - Multiple audio file upload manager
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles ordered lists of audio files
 * - Audio player preview for uploaded files
 * - Supports common audio formats
 * - File size validation
 *
 * #### Example: Basic usage
 * ```tsx
 * <AudioRepeaterField
 *   label="Podcast Episodes"
 *   field="episodes"
 *   urlField="audio.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: Sortable with baseField and some optional props
 * ```tsx
 * <AudioRepeaterField
 *   field="episodes"
 *   baseField="audio"
 *   urlField="url"
 *   sortableBy="order"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Audio file"
 * />
 * ```
 */
export const AudioRepeaterField = Component<AudioRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createAudioFileType(props)}>
		{props.children ?? (
			<UploadedAudioView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
		)}
	</FileRepeaterFieldInner>
</>)

export type VideoRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& VideoFileTypeProps

/**
 * VideoRepeaterField component - Ordered video upload collection
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Manages multiple video uploads
 * - Video preview thumbnails
 * - Drag-and-drop sequence control
 * - Upload progress tracking
 *
 * #### Example: Basic usage
 * ```tsx
 * <VideoRepeaterField
 *   label="Course Videos"
 *   field="courses"
 *   urlField="video.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: Sortable with baseField and some optional props
 * ```tsx
 * <VideoRepeaterField
 *   field="courses"
 *   baseField="video"
 *   urlField="url"
 *   sortableBy="order"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   label="Course Videos"
 * />
 * ```
 */
export const VideoRepeaterField = Component<VideoRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createVideoFileType(props)}>
		{props.children ?? (
			<UploadedVideoView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
		)}
	</FileRepeaterFieldInner>
</>)

export type FileRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& AnyFileTypeProps

/**
 * FileRepeaterField component - Generic multi-file upload repeater
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles any file type in a list format
 * - File type icon display
 * - Customizable preview components
 * - Sortable document lists
 *
 * #### Example: Basic usage
 * ```tsx
 * <FileRepeaterField
 *   label="Attachments"
 *   field="attachments"
 *   urlField="file.url"
 *   orderBy="createdAt"
 * />
 * ```
 *
 * #### Example: Sortable with baseField and some optional props
 * ```tsx
 * <FileRepeaterField
 *  field="attachments"
 *  baseField="file"
 *  urlField="url"
 *  sortableBy="order"
 *  fileNameField="fileName"
 *  fileSizeField="fileSize"
 *  fileTypeField="fileType"
 *  lastModifiedField="lastModified"
 *  label="File"
 * />
 * ```
 */
export const FileRepeaterField = Component<FileRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createAnyFileType(props)}>
		{props.children ?? (
			<UploadedAnyView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
		)}
	</FileRepeaterFieldInner>
</>)


type PreviewRenderer = (props: {
	file: FileWithMeta
}) => ReactNode

type FileRepeaterFieldInnerProps =
	& BaseFileRepeaterFieldProps
	& {
		fileType: FileType
		children: ReactNode
		renderPreview?: PreviewRenderer
	}

const FileRepeaterFieldInner = Component<FileRepeaterFieldInnerProps>(({
	baseField,
	label,
	description,
	children,
	fileType,
	dropzonePlaceholder,
	renderPreview,
	getUploadOptions,
	...props
}) => {

	const defaultUploader = useS3Client({
		getUploadOptions,
	})
	const [fileTypeStable] = useState(fileType)
	const fileTypeWithUploader = useMemo(
		() => ({ ...fileTypeStable, uploader: fileTypeStable?.uploader ?? defaultUploader }),
		[defaultUploader, fileTypeStable],
	)

	// const entity = useEntity()
	// const errors = type.extractors?.flatMap(it => it.getErrorsHolders?.({
	// 	environment,
	// 	entity,
	// }) ?? []).flatMap(it => it.errors?.errors ?? [])

	return (
		<FormFieldStateProvider>
			<FormContainer description={description} label={label}>
				<Repeater {...props} initialEntityCount={0}>
					<UploaderRepeaterItemsWrapperUI>

						<MultiUploader baseField={baseField} fileType={fileTypeWithUploader}>
							<UploaderHasFile>
								<UploaderProgress />
							</UploaderHasFile>
							<UploaderDropzone dropzonePlaceholder={dropzonePlaceholder} />

							<RepeaterSortable>

								<RepeaterSortableEachItem>
									<div className="flex">
										<UploaderRepeaterDropIndicator position={'before'} />
										<RepeaterSortableItemNode>
											<UploaderRepeaterItemUI>
												<RepeaterSortableItemActivator>
													<UploaderRepeaterHandleUI />
												</RepeaterSortableItemActivator>

												<FileRepeaterItemPreview renderPreview={renderPreview} >
													{children}
												</FileRepeaterItemPreview>
											</UploaderRepeaterItemUI>
										</RepeaterSortableItemNode>
										<UploaderRepeaterDropIndicator position={'after'} />
									</div>


								</RepeaterSortableEachItem>

								<RepeaterSortableDragOverlay>
									<UploaderRepeaterDragOverlayUI>
										{children}
									</UploaderRepeaterDragOverlayUI>
								</RepeaterSortableDragOverlay>

							</RepeaterSortable>
						</MultiUploader>
					</UploaderRepeaterItemsWrapperUI>
				</Repeater>
			</FormContainer>
		</FormFieldStateProvider>
	)
}, ({ baseField, label, description, children, fileType, ...props }) => {
	return <>
		<Repeater {...props} initialEntityCount={0}>
			<MultiUploader baseField={baseField} fileType={fileType} />
			{children}
		</Repeater>
	</>
}, 'FileRepeaterFieldInner')

const FileRepeaterItemPreview = ({ renderPreview, children }: { renderPreview?: PreviewRenderer; children: ReactNode }) => {
	const entity = useEntity()
	const fileState = useMultiUploaderFileState(entity)
	if (!fileState || fileState.state === 'success' || fileState.state === 'error') {
		return <>{children}</>
	}

	return <>
		{renderPreview?.({ file: fileState.file })}
		<Loader position="absolute" className="bg-transparent" />
	</>
}
