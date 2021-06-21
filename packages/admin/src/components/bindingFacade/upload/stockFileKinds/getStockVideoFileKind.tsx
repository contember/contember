import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
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
import type { AcceptFileOptions, FileDataExtractor, FullFileKind, RenderFilePreviewOptions } from '../interfaces'

export interface StockVideoFileKindProps<AcceptArtifacts = unknown>
	extends Partial<Omit<FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts>, 'extractors'>>,
		FileUrlDataExtractorProps,
		GenericFileMetadataExtractorProps,
		DestroyDataExtractorProps,
		VideoFileDataExtractorProps {
	additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
}

export const acceptVideoFile = ({ file }: AcceptFileOptions) => file.type.startsWith('video')
export const renderVideoFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <video src={objectUrl} controls />

export const getStockVideoFileKind = <AcceptArtifacts extends any = unknown>({
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
}: StockVideoFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getDestroyDataExtractor({ deleteOnRemoveField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		getVideoFileDataExtractor({ heightField, widthField, durationField }),
		...additionalExtractors,
	]
	const renderUploadedVideo = renderUploadedFile ?? <VideoFieldView srcField={urlField} />

	return {
		acceptFile,
		acceptMimeTypes,
		children,
		extractors,
		renderFilePreview,
		renderUploadedFile: renderUploadedVideo,
		uploader,
	}
}
