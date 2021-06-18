import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { FileUrlFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	AudioFileDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
} from '../fileDataExtractors'
import {
	getAudioFileDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
} from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type {
	AcceptFileOptions,
	DiscriminatedFileKind,
	FileDataExtractor,
	RenderFilePreviewOptions,
} from '../interfaces'

export interface AudioFileKindProps<AcceptArtifacts = unknown>
	extends Partial<
			Omit<DiscriminatedFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'discriminateBy' | 'extractors'>
		>,
		Required<FileUrlDataExtractorProps>,
		GenericFileMetadataExtractorProps,
		AudioFileDataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptAudioFile = ({ file }: AcceptFileOptions) => file.type.startsWith('audio')
export const renderAudioFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <audio src={objectUrl} controls />

export const AudioFileKind = Component<AudioFileKindProps>(
	({
		discriminateBy,
		additionalExtractors = emptyArray,
		acceptMimeTypes = 'audio/*',
		acceptFile = acceptAudioFile,
		children,
		durationField,
		fileSizeField,
		fileTypeField,
		lastModifiedField,
		fileNameField,
		renderFilePreview = renderAudioFilePreview,
		renderUploadedFile,
		uploader = defaultUploader,
		urlField,
	}) => {
		const extractors: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata>[] = [
			getFileUrlDataExtractor({ urlField }),
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getAudioFileDataExtractor({ durationField }),
			...additionalExtractors,
		]
		const renderUploadedAudio = renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} /> // TODO
		return (
			<FileKind
				discriminateBy={discriminateBy}
				acceptMimeTypes={acceptMimeTypes}
				acceptFile={acceptFile}
				renderFilePreview={renderFilePreview}
				renderUploadedFile={renderUploadedAudio}
				uploader={uploader}
				extractors={extractors}
				children={children}
			/>
		)
	},
	'AudioFileKind',
) as <AcceptArtifacts = unknown>(props: AudioFileKindProps<AcceptArtifacts>) => ReactElement | null
