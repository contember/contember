import { Component, DisconnectEntityTrigger, EntityView, useEntity } from '@contember/interface'
import { FormFieldStateProvider } from '@contember/react-form'
import {
	AnyFileTypeProps,
	AudioFileTypeProps,
	createAnyFileType,
	createAudioFileType,
	createImageFileType,
	createVideoFileType,
	FileType,
	FileUrlDataExtractorProps,
	ImageFileTypeProps, S3FileOptions,
	Uploader,
	UploaderBase,
	UploaderBaseFieldProps,
	UploaderHasFile,
	useS3Client,
	VideoFileTypeProps,
} from '@contember/react-uploader'
import { ReactNode, useMemo, useState } from 'react'
import {
	UploadedAnyView,
	UploadedAudioView,
	UploadedImageView,
	UploadedVideoView,
	UploaderDropzone,
	UploaderItemUI,
} from '../upload'
import { UploaderProgress } from '../upload/upload-progress'
import { FormContainer, FormContainerProps } from './container'

type UploadFieldInnerProps =
	& BaseUploadFieldProps
	& FileUrlDataExtractorProps
	& {
		fileType: FileType
		children: ReactNode
	}

const UploadFieldInner = Component((({
	baseField,
	label,
	description,
	children,
	fileType,
	urlField,
	dropzonePlaceholder,
	getUploadOptions,
}: UploadFieldInnerProps) => {
	const entity = useEntity()
	const defaultUploader = useS3Client({
		getUploadOptions,
	})
	const [fileTypeStable] = useState(fileType)
	const fileTypeWithUploader = useMemo(
		() => ({ ...fileTypeStable, uploader: fileTypeStable?.uploader ?? defaultUploader }),
		[defaultUploader, fileTypeStable],
	)

	// const errors = type.extractors?.flatMap(it => it.getErrorsHolders?.({
	// 	environment,
	// 	entity,
	// }) ?? []).flatMap(it => it.errors?.errors ?? [])

	return (
		<FormFieldStateProvider>
			<FormContainer description={description} label={label}>
				<div className="flex">

					<Uploader baseField={baseField} fileType={fileTypeWithUploader}>
						<UploaderBase baseField={baseField}>
							<UploaderHasFile>
								<UploaderProgress />
							</UploaderHasFile>
						</UploaderBase>

						<UploaderItemUI>
							<EntityView render={entity => {
								entity = baseField ? entity.getEntity({ field: baseField }) : entity
								if (entity.getField(urlField).value === null) {
									return <UploaderDropzone inactiveOnUpload dropzonePlaceholder={dropzonePlaceholder} />
								} else {
									return children
								}
							}} />
						</UploaderItemUI>
					</Uploader>
				</div>
			</FormContainer>
		</FormFieldStateProvider>
	)
}), ({ fileType, children, baseField }) => {
	return <>
		{children}
		<Uploader baseField={baseField} fileType={fileType}></Uploader>
	</>
})


export type BaseUploadFieldProps =
	& Omit<FormContainerProps, 'children'>
	& UploaderBaseFieldProps
	& {
		dropzonePlaceholder?: ReactNode
		actions?: ReactNode
		edit?: ReactNode
		/**  Disables file removal capability */
		noDestroy?: boolean
		getUploadOptions?: (file: File) => S3FileOptions
	}

export type ImageFieldProps =
	& BaseUploadFieldProps
	& ImageFileTypeProps

/**
 * ImageField component - Specialized file upload for images
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Handles image file uploads with preview
 * - Supports common image formats (from ImageFileTypeProps)
 * - Integrated drag-and-drop zone
 * - Auto-generated preview using UploadedImageView
 * - Optional custom destruction control
 *
 * #### Example: Basic usage
 * ```tsx
 * <ImageField
 *   label="Profile Picture"
 *   urlField="avatar.url"
 *   dropzonePlaceholder="Drag image here"
 * />
 * ```
 * #### Example: With baseField and custom dropzone
 * ```tsx
 * <ImageField
 *   baseField="image"
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
 *           <SelectImage />
 *         </div>
 *       </div>
 *     </UploaderDropzoneAreaUI>
 *   )}
 * />
 * ```
 */
export const ImageField = Component<ImageFieldProps>(props => (
	<UploadFieldInner {...props} fileType={createImageFileType(props)}>
		{props.children ?? (
			<UploadedImageView {...props} DestroyAction={DisconnectEntityTrigger} />
		)}
	</UploadFieldInner>
))

export type AudioFieldProps =
	& BaseUploadFieldProps
	& AudioFileTypeProps

/**
 * `AudioField` is a specialized upload component for handling audio files. It provides built-in file validation, an audio preview, and metadata tracking.
 *
 * #### Example: Basic usage
 * ```tsx
 * <AudioField
 *   label="Podcast File"
 *   urlField="audio.url"
 * />
 * ```
 *
 * #### Example: With metadata fields
 * ```tsx
 * <AudioField
 *   label="Podcast File"
 *   baseField="audio"
 *   urlField="url"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   accept={{ 'audio/*': ['.mp3', '.wav', '.ogg'] }}
 * />
 * ```
 */

export const AudioField = Component<AudioFieldProps>(props => (
	<UploadFieldInner {...props} fileType={createAudioFileType(props)}>
		{props.children ?? (
			<UploadedAudioView {...props} DestroyAction={DisconnectEntityTrigger} />
		)}
	</UploadFieldInner>
))

export type VideoFieldProps =
	& BaseUploadFieldProps
	& VideoFileTypeProps

/**
 * `VideoField` is a specialized upload component for handling video files with built-in preview capabilities.
 *
 * #### Example: Basic usage
 * ```tsx
 * <VideoField
 *   label="Demo Video"
 *   urlField="video.url"
 * />
 * ```
 *
 * #### Example: With metadata fields
 * ```tsx
 * <VideoField
 *   label="Demo Video"
 *   baseField="video"
 *   urlField="url"
 *   durationField="duration"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   accept={{ 'video/*': ['.mp4', '.webm', '.ogg'] }}
 * />
 * ```
 */
export const VideoField = Component<VideoFieldProps>(props => (
	<UploadFieldInner {...props} fileType={createVideoFileType(props)}>
		{props.children ?? (
			<UploadedVideoView {...props} DestroyAction={DisconnectEntityTrigger} />
		)}
	</UploadFieldInner>
))

export type FileFieldProps =
	& BaseUploadFieldProps
	& AnyFileTypeProps

/**
 * `FileField` is a generic file upload component that supports any file type.
 *
 * #### Example: Basic usage
 * ```tsx
 * <FileField label="Document" urlField="file.url" />
 * ```
 *
 * #### Example: With metadata fields and custom dropzone placeholder
 * ```tsx
 * <FileField
 *   label="Document"
 *   baseField="document"
 *   urlField="file.url"
 *   fileNameField="fileName"
 *   fileSizeField="fileSize"
 *   fileTypeField="fileType"
 *   lastModifiedField="lastModified"
 *   dropzonePlaceholder="Drag PDF here"
 *   accept={{ 'application/*': ['.pdf'] }}
 * />
 * ```
 */
export const FileField = Component<FileFieldProps>(props => (
	<UploadFieldInner {...props} fileType={createAnyFileType(props)}>
		{props.children ?? (
			<UploadedAnyView {...props} DestroyAction={DisconnectEntityTrigger} />
		)}
	</UploadFieldInner>
))
