import type { S3FileUploader } from '@contember/client'
import { FileUrlFieldView } from '../../../fieldViews'
import { defaultUploader } from '../../defaultUploader'
import type { AudioFileDataExtractorProps, FileDataExtractor } from '../../fileDataExtractors'
import {
	getAudioFileDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
} from '../../fileDataExtractors'
import { CommonFileKindProps } from '../types'
import { AcceptFileOptions, FullFileKind, RenderFilePreviewOptions } from '../FullFileKind'

export type StockAudioFileKindProps<AcceptArtifacts = unknown> =
	& CommonFileKindProps<AcceptArtifacts>
	& AudioFileDataExtractorProps

export const acceptAudioFile = ({ file }: AcceptFileOptions) => file.type.startsWith('audio')
export const renderAudioFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <audio src={objectUrl} controls />

export const getStockAudioFileKind = <AcceptArtifacts extends any = unknown>({
	additionalExtractors = [],
	acceptMimeTypes = 'audio/*',
	acceptFile = acceptAudioFile,
	baseEntity,
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
}: StockAudioFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		getAudioFileDataExtractor({ durationField }),
		...additionalExtractors,
	]

	return {
		acceptMimeTypes,
		acceptFile,
		renderFilePreview,
		uploader,
		renderUploadedFile: renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} />,
		baseEntity,
		children,
		extractors,
	}
}
