import {
	AnyFileTypeProps,
	AudioFileTypeProps,
	createAnyFileType,
	createAudioFileType,
	createImageFileType,
	createVideoFileType,
	FileType,
	ImageFileTypeProps,
	MultiUploader,
	UploaderBaseFieldProps,
	UploaderHasFile,
	useS3Client,
	VideoFileTypeProps,
} from '@contember/react-uploader'
import * as React from 'react'
import { ReactNode, useId, useMemo, useState } from 'react'
import { FormContainer, FormContainerProps } from './container'
import { Component } from '@contember/interface'
import { FormErrorContext, FormFieldIdContext, FormFieldStateProvider } from '@contember/react-form'
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


export type BaseFileRepeaterFieldProps =
	& Omit<FormContainerProps, 'children'>
	& RepeaterProps
	& UploaderBaseFieldProps
	& {
		dropzonePlaceholder?: ReactNode
		actions?: ReactNode
		edit?: ReactNode
		noDestroy?: boolean
	}

export type ImageRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& ImageFileTypeProps

export const ImageRepeaterField = Component<ImageRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createImageFileType(props)}>
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


type FileRepeaterFieldInnerProps =
	& BaseFileRepeaterFieldProps
	& {
		fileType: FileType
		children: ReactNode
	}

const FileRepeaterFieldInner = Component<FileRepeaterFieldInnerProps>(({
	baseField,
	label,
	description,
	children,
	fileType,
	dropzonePlaceholder,
	...props
}) => {

	const defaultUploader = useS3Client()
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
						</MultiUploader>

						<RepeaterSortable>

							<RepeaterSortableEachItem>
								<div className="flex">
									<UploaderRepeaterDropIndicator position={'before'} />
									<RepeaterSortableItemNode>
										<UploaderRepeaterItemUI>
											<RepeaterSortableItemActivator>
												<UploaderRepeaterHandleUI />
											</RepeaterSortableItemActivator>
											{children}
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
