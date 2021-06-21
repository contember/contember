import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import { FileUrlFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	DestroyDataExtractorProps,
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	AudioFileDataExtractorProps,
} from '../fileDataExtractors'
import {
	getDestroyDataExtractor,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getAudioFileDataExtractor,
} from '../fileDataExtractors'
import type { AcceptFileOptions, FileDataExtractor, FullFileKind, RenderFilePreviewOptions } from '../interfaces'

export interface StockAudioFileKindProps<AcceptArtifacts = unknown>
	extends Partial<Omit<FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'extractors'>>,
		FileUrlDataExtractorProps,
		GenericFileMetadataExtractorProps,
		DestroyDataExtractorProps,
		AudioFileDataExtractorProps {
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptAudioFile = ({ file }: AcceptFileOptions) => file.type.startsWith('audio')
export const renderAudioFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <audio src={objectUrl} controls />

export const getStockAudioFileKind = <AcceptArtifacts extends any = unknown>({
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
}: StockAudioFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getDestroyDataExtractor({ deleteOnRemoveField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		getAudioFileDataExtractor({ durationField }),
		...additionalExtractors,
	]
	const renderUploadedAudio = renderUploadedFile ?? <FileUrlFieldView fileUrlField={urlField} /> // TODO

	return {
		acceptFile,
		acceptMimeTypes,
		children,
		extractors,
		renderFilePreview,
		renderUploadedFile: renderUploadedAudio,
		uploader,
	}
}
