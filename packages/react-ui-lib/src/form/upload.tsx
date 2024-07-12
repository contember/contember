import {
	AnyFileTypeProps,
	AudioFileTypeProps,
	createAnyFileType,
	createAudioFileType,
	createImageFileType,
	createVideoFileType,
	FileType,
	FileUrlDataExtractorProps,
	ImageFileTypeProps,
	MultiUploader,
	Uploader,
	UploaderBase,
	UploaderBaseFieldProps,
	UploaderHasFile,
	useS3Client,
	VideoFileTypeProps,
} from '@contember/react-uploader'
import * as React from 'react'
import { ReactNode, useId, useMemo, useState } from 'react'
import { FormContainer, FormContainerProps } from './container'
import { Component, DisconnectEntityTrigger, EntityView, useEntity } from '@contember/interface'
import { FormErrorContext, FormFieldIdContext } from '@contember/react-form'
import {
	UploadedAnyView,
	UploadedAudioView,
	UploadedImageView,
	UploadedVideoView,
	UploaderDropzone,
	UploaderItemUI,
	UploaderRepeaterDragOverlayUI,
	UploaderRepeaterHandleUI,
	UploaderRepeaterItemsWrapperUI,
	UploaderRepeaterItemUI,
} from '../upload'
import { UploaderProgress } from '../upload/upload-progress'
import { Repeater, RepeaterProps, RepeaterRemoveItemTrigger } from '@contember/react-repeater'
import { RepeaterSortable, RepeaterSortableDragOverlay, RepeaterSortableEachItem, RepeaterSortableItemActivator, RepeaterSortableItemNode } from '@contember/react-repeater-dnd-kit'
import { UploaderRepeaterDropIndicator } from '../upload/repeater'

export type BaseFieldProps =
	& Omit<FormContainerProps, 'children'>
	& UploaderBaseFieldProps
	& {
		dropzonePlaceholder?: ReactNode
	}



export type ImageFieldProps =
	& BaseFieldProps
	& ImageFileTypeProps

export const ImageField = Component<ImageFieldProps>(props => {
	return (
		<UploadFieldInner {...props} fileType={createImageFileType(props)}>
			<UploaderItemUI>
				{props.children ?? (
					<UploaderBase baseField={props.baseField}>
						<UploadedImageView {...props} DestroyAction={DisconnectEntityTrigger} />
					</UploaderBase>
				)}
			</UploaderItemUI>
		</UploadFieldInner>
	)
})

export type AudioFieldProps =
	& BaseFieldProps
	& AudioFileTypeProps

export const AudioField = Component<AudioFieldProps>(props => {
	return (
		<UploadFieldInner {...props} fileType={createAudioFileType(props)}>
			<UploaderItemUI>
				{props.children ?? (
					<UploaderBase baseField={props.baseField}>
						<UploadedAudioView {...props} DestroyAction={DisconnectEntityTrigger} />
					</UploaderBase>
				)}
			</UploaderItemUI>
		</UploadFieldInner>
	)
})


export type VideoFieldProps =
	& BaseFieldProps
	& VideoFileTypeProps

export const VideoField = Component<VideoFieldProps>(props => {
	return (
		<UploadFieldInner {...props} fileType={createVideoFileType(props)}>
			<UploaderItemUI>
				{props.children ?? (
					<UploaderBase baseField={props.baseField}>
						<UploadedVideoView {...props} DestroyAction={DisconnectEntityTrigger} />
					</UploaderBase>
				)}
			</UploaderItemUI>
		</UploadFieldInner>
	)
})

export type FileFieldProps =
	& BaseFieldProps
	& AnyFileTypeProps

export const FileField = Component<FileFieldProps>(props => {
	return (
		<UploadFieldInner {...props} fileType={createAnyFileType(props)}>
			<UploaderItemUI>
				{props.children ?? (
					<UploaderBase baseField={props.baseField}>
						<UploadedAnyView {...props} DestroyAction={DisconnectEntityTrigger} />
					</UploaderBase>
				)}
			</UploaderItemUI>
		</UploadFieldInner>
	)
})


type UploadFieldInnerProps =
	& BaseFieldProps
	& FileUrlDataExtractorProps
	& {
		fileType: FileType
		children: ReactNode
	}

const UploadFieldInner = Component((({ baseField, label, description, children, fileType, urlField, dropzonePlaceholder }: UploadFieldInnerProps) => {
	const entity = useEntity()
	const defaultUploader = useS3Client()
	const [fileTypeStable] = useState(fileType)
	const fileTypeWithUploader = useMemo(
		() => ({ ...fileTypeStable, uploader: fileTypeStable?.uploader ?? defaultUploader }),
		[defaultUploader, fileTypeStable],
	)

	// const errors = type.extractors?.flatMap(it => it.getErrorsHolders?.({
	// 	environment,
	// 	entity,
	// }) ?? []).flatMap(it => it.errors?.errors ?? [])

	const id = useId()
	return (
		<FormFieldIdContext.Provider value={id}>
			<FormErrorContext.Provider value={[]}>
				<FormContainer description={description} label={label}>
					<div className="flex">

						<Uploader baseField={baseField} fileType={fileTypeWithUploader}>
							<UploaderBase baseField={baseField}>
								<UploaderHasFile>
									<UploaderProgress />
								</UploaderHasFile>
							</UploaderBase>

							<EntityView render={entity => {
								entity = baseField ? entity.getEntity({ field: baseField }) : entity
								if (entity.getField(urlField).value === null) {
									return <UploaderDropzone inactiveOnUpload dropzonePlaceholder={dropzonePlaceholder} />
								} else {
									return children
								}
							}} />
						</Uploader>
					</div>
				</FormContainer>
			</FormErrorContext.Provider>
		</FormFieldIdContext.Provider>
	)
}), ({ fileType, children, baseField }) => {
	return <>
		{children}
		<Uploader baseField={baseField} fileType={fileType}></Uploader>
	</>
})

export type BaseFileRepeaterFieldProps =
	& Omit<FormContainerProps, 'children'>
	& RepeaterProps
	& UploaderBaseFieldProps
	& {
		dropzonePlaceholder?: ReactNode
	}

export type ImageRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& ImageFileTypeProps

export const ImageRepeaterField = Component<ImageRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createImageFileType(props)}>
		{props.children ?? (
			<UploaderBase baseField={props.baseField}>
				<UploadedImageView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
			</UploaderBase>
		)}
	</FileRepeaterFieldInner>
</>)


export type AudioRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& AudioFileTypeProps

export const AudioRepeaterField = Component<AudioRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createAudioFileType(props)}>
		{props.children ?? (
			<UploaderBase baseField={props.baseField}>
				<UploadedAudioView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
			</UploaderBase>
		)}
	</FileRepeaterFieldInner>
</>)


export type VideoRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& VideoFileTypeProps

export const VideoRepeaterField = Component<VideoRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createVideoFileType(props)}>
		{props.children ?? (
			<UploaderBase baseField={props.baseField}>
				<UploadedVideoView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
			</UploaderBase>
		)}
	</FileRepeaterFieldInner>
</>)


export type FileRepeaterFieldProps =
	& BaseFileRepeaterFieldProps
	& AnyFileTypeProps

export const FileRepeaterField = Component<FileRepeaterFieldProps>(props => <>
	<FileRepeaterFieldInner {...props} fileType={createAnyFileType(props)}>
		{props.children ?? (
			<UploaderBase baseField={props.baseField}>
				<UploadedAnyView {...props} DestroyAction={RepeaterRemoveItemTrigger} />
			</UploaderBase>
		)}
	</FileRepeaterFieldInner>
</>)


type FileRepeaterFieldInnerProps =
	& BaseFileRepeaterFieldProps
	& {
		fileType: FileType
		children: ReactNode
	}

const FileRepeaterFieldInner = Component<FileRepeaterFieldInnerProps>(({ baseField, label, description, children, fileType, dropzonePlaceholder, ...props }) => {

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

	const id = useId()
	return (
		<FormFieldIdContext.Provider value={id}>
			<FormErrorContext.Provider value={[]}>
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
			</FormErrorContext.Provider>
		</FormFieldIdContext.Provider>
	)
}, ({ baseField, label, description, children, fileType, ...props }) => {
	return <>
		<Repeater {...props} initialEntityCount={0}>
			<MultiUploader baseField={baseField} fileType={fileType} />
			{children}
		</Repeater>
	</>
}, 'FileRepeaterFieldInner')
