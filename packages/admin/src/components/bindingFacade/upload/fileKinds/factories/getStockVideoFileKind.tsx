import type { S3FileUploader } from '@contember/client'
import { VideoFieldView } from '../../../fieldViews'
import { defaultUploader } from '../../defaultUploader'
import type { FileDataExtractor, VideoFileDataExtractorProps } from '../../fileDataExtractors'
import {
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getVideoFileDataExtractor,
} from '../../fileDataExtractors'
import { CommonFileKindProps } from '../types'
import { AcceptFileOptions, FullFileKind, RenderFilePreviewOptions } from '../FullFileKind'

export type StockVideoFileKindProps<AcceptArtifacts = unknown> =
	& CommonFileKindProps<AcceptArtifacts>
	& VideoFileDataExtractorProps

export const acceptVideoFile = ({ file }: AcceptFileOptions) => file.type.startsWith('video')
export const renderVideoFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <video src={objectUrl} controls />

export const getStockVideoFileKind = <AcceptArtifacts extends any = unknown>({
	additionalExtractors = [],
	acceptMimeTypes = 'video/*',
	acceptFile = acceptVideoFile,
	baseEntity,
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
	childrenOutsideBaseEntity,
}: StockVideoFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		getVideoFileDataExtractor({ heightField, widthField, durationField }),
		...additionalExtractors,
	]
	return {
		acceptMimeTypes,
		acceptFile,
		renderFilePreview,
		uploader,
		renderUploadedFile: renderUploadedFile ?? <VideoFieldView srcField={urlField} />,
		children,
		childrenOutsideBaseEntity,
		baseEntity,
		extractors,
	}
}
