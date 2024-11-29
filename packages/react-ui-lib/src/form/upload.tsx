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
	Uploader,
	UploaderBase,
	UploaderBaseFieldProps,
	UploaderHasFile,
	useS3Client,
	VideoFileTypeProps,
} from '@contember/react-uploader'
import * as React from 'react'
import { ReactNode, useMemo, useState } from 'react'
import { FormContainer, FormContainerProps } from './container'
import { Component, DisconnectEntityTrigger, EntityView, useEntity } from '@contember/interface'
import { FormFieldStateProvider } from '@contember/react-form'
import { UploadedAnyView, UploadedAudioView, UploadedImageView, UploadedVideoView, UploaderDropzone, UploaderItemUI } from '../upload'
import { UploaderProgress } from '../upload/upload-progress'

export type BaseUploadFieldProps =
	& Omit<FormContainerProps, 'children'>
	& UploaderBaseFieldProps
	& {
		dropzonePlaceholder?: ReactNode
		actions?: ReactNode
		edit?: ReactNode
		noDestroy?: boolean
	}


export type ImageFieldProps =
	& BaseUploadFieldProps
	& ImageFileTypeProps

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

export const FileField = Component<FileFieldProps>(props => (
	<UploadFieldInner {...props} fileType={createAnyFileType(props)}>
		{props.children ?? (
			<UploadedAnyView {...props} DestroyAction={DisconnectEntityTrigger} />
		)}
	</UploadFieldInner>
))


type UploadFieldInnerProps =
	& BaseUploadFieldProps
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
