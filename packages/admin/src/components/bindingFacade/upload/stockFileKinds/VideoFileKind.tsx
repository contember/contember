import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { VideoFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	VideoFileDataExtractorProps,
} from '../fileDataExtractors'
import {
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getVideoFileDataExtractor,
} from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type {
	AcceptFileOptions,
	DiscriminatedFileKind,
	FileDataExtractor,
	RenderFilePreviewOptions,
} from '../interfaces'

export interface VideoFileKindProps<AcceptArtifacts = unknown, FileData = unknown>
	extends Partial<
			Omit<
				DiscriminatedFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts, FileData>,
				'discriminateBy' | 'extractors'
			>
		>,
		Required<FileUrlDataExtractorProps>,
		GenericFileMetadataExtractorProps,
		VideoFileDataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<FileData, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptVideoFile = ({ file }: AcceptFileOptions) => file.type.startsWith('video')
export const renderVideoFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <video src={objectUrl} controls />

export const VideoFileKind = Component<VideoFileKindProps>(
	({
		discriminateBy,
		additionalExtractors = emptyArray,
		acceptMimeTypes = 'video/*',
		acceptFile = acceptVideoFile,
		children,
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
	'VideoFileKind',
) as <AcceptArtifacts = unknown, FileData = unknown>(
	props: VideoFileKindProps<AcceptArtifacts, FileData>,
) => ReactElement | null
