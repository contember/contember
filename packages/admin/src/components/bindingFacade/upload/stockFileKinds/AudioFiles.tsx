import { Component } from '@contember/binding'
import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import type { ReactElement } from 'react'
import { FileUrlFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	AudioFileDataExtractorProps,
	DestroyDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
} from '../fileDataExtractors'
import {
	getAudioFileDataExtractor,
	getDestroyDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
} from '../fileDataExtractors'
import { FileKind } from '../FileKind'
import type {
	AcceptFileOptions,
	DiscriminatedFileKind,
	FileDataExtractor,
	FullFileKind,
	RenderFilePreviewOptions,
} from '../interfaces'

export interface AudioFilesProps<AcceptArtifacts = unknown>
	extends Partial<Omit<FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'extractors'>>,
		FileUrlDataExtractorProps,
		GenericFileMetadataExtractorProps,
		DestroyDataExtractorProps,
		AudioFileDataExtractorProps {
	discriminateBy: DiscriminatedFileKind['discriminateBy']
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptAudioFile = ({ file }: AcceptFileOptions) => file.type.startsWith('audio')
export const renderAudioFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <audio src={objectUrl} controls />

export const AudioFiles = Component<AudioFilesProps>(
	({
		discriminateBy,
		additionalExtractors = emptyArray,
		acceptMimeTypes = 'audio/*',
		acceptFile = acceptAudioFile,
		children,
		deleteOnRemoveField,
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
			getDestroyDataExtractor({ deleteOnRemoveField }),
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
	'AudioFiles',
) as <AcceptArtifacts = unknown>(props: AudioFilesProps<AcceptArtifacts>) => ReactElement | null
