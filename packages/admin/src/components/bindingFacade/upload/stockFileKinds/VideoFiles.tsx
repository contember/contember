import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { VideoFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	DestroyDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	VideoFileDataExtractorProps,
} from '../fileDataExtractors'
import {
	getDestroyDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getVideoFileDataExtractor,
} from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type {
	AcceptFileOptions,
	DiscriminatedFileKind,
	FileDataExtractor,
	FullFileKind,
	RenderFilePreviewOptions,
} from '../interfaces'

export interface VideoFilesProps<AcceptArtifacts = unknown>
	extends Partial<Omit<FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'extractors'>>,
		FileUrlDataExtractorProps,
		GenericFileMetadataExtractorProps,
		DestroyDataExtractorProps,
		VideoFileDataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptVideoFile = ({ file }: AcceptFileOptions) => file.type.startsWith('video')
export const renderVideoFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <video src={objectUrl} controls />

export const VideoFiles = Component<VideoFilesProps>(
	({
		discriminateBy,
		additionalExtractors = emptyArray,
		acceptMimeTypes = 'video/*',
		acceptFile = acceptVideoFile,
		children,
		deleteOnRemoveField,
		durationField,
		fileSizeField,
		fileTypeField,
		lastModifiedField,
		fileNameField,
		renderFilePreview = renderVideoFilePreview,
		renderUploadedFile,
		heightField,
		widthField,
		uploader = defaultUploader,
		urlField,
	}) => {
		const extractors: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata>[] = [
			getFileUrlDataExtractor({ urlField }),
			getDestroyDataExtractor({ deleteOnRemoveField }),
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getVideoFileDataExtractor({ heightField, widthField, durationField }),
			...additionalExtractors,
		]
		const renderUploadedVideo = renderUploadedFile ?? <VideoFieldView srcField={urlField} />
		return (
			<FileKind
				discriminateBy={discriminateBy}
				acceptMimeTypes={acceptMimeTypes}
				acceptFile={acceptFile}
				renderFilePreview={renderFilePreview}
				renderUploadedFile={renderUploadedVideo}
				uploader={uploader}
				extractors={extractors}
				children={children}
			/>
		)
	},
	'VideoFiles',
) as <AcceptArtifacts = unknown>(props: VideoFilesProps<AcceptArtifacts>) => ReactElement | null
