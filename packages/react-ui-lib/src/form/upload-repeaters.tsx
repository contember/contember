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
