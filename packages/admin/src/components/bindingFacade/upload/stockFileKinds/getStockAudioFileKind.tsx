import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
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
import type { AcceptFileOptions, FileDataExtractor, FullFileKind, RenderFilePreviewOptions } from '../interfaces'
import { PublicFileKind } from '../interfaces/FullFileKind'

export type StockAudioFileKindProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts, SFExtraProps>
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& AudioFileDataExtractorProps
	& {
		additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
	}

export const acceptAudioFile = ({ file }: AcceptFileOptions) => file.type.startsWith('audio')
export const renderAudioFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <audio src={objectUrl} controls />

export const getStockAudioFileKind = <AcceptArtifacts extends any = unknown>({
	additionalExtractors = emptyArray,
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
	...rest
}: StockAudioFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		getAudioFileDataExtractor({ durationField }),
		...additionalExtractors,
	]
	const renderUploadedAudio = renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} /> // TODO

	return {
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		children,
		extractors,
		renderFilePreview,
		renderUploadedFile: renderUploadedAudio,
		uploader,
		...rest,
	}
}
