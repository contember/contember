import type { S3FileUploader } from '@contember/client'
import { emptyArray } from '@contember/react-utils'
import { ImageFieldView } from '../../fieldViews'
import { defaultUploader } from '../defaultUploader'
import type {
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	ImageFileDataExtractorProps,
} from '../fileDataExtractors'
import {
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getImageFileDataExtractor,
} from '../fileDataExtractors'
import type { AcceptFileOptions, FileDataExtractor, FullFileKind, RenderFilePreviewOptions } from '../interfaces'
import { PublicFileKind } from '../interfaces/FullFileKind'

export type StockImageFileKindProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts, SFExtraProps>
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& ImageFileDataExtractorProps
	& {
		additionalExtractors?: FileDataExtractor<unknown, S3FileUploader.SuccessMetadata, AcceptArtifacts>[]
	}

export const acceptImageFile = ({ file }: AcceptFileOptions) => file.type.startsWith('image')
export const renderImageFilePreview = ({ objectUrl }: RenderFilePreviewOptions) => <img src={objectUrl} alt="" />

export const getStockImageFileKind = <AcceptArtifacts extends any = unknown>({
	additionalExtractors = emptyArray,
	acceptMimeTypes = 'image/*',
	acceptFile = acceptImageFile,
	baseEntity,
	children,
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	renderFilePreview = renderImageFilePreview,
	renderUploadedFile,
	heightField,
	widthField,
	uploader = defaultUploader,
	urlField,
	...rest
}: StockImageFileKindProps<AcceptArtifacts>): FullFileKind<S3FileUploader.SuccessMetadata, AcceptArtifacts> => {
	const extractors: FileDataExtractor<any, S3FileUploader.SuccessMetadata, AcceptArtifacts>[] = [
		getFileUrlDataExtractor({ urlField }),
		getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
		getImageFileDataExtractor({ heightField, widthField }),
		...additionalExtractors,
	]
	const renderUploadedImage = renderUploadedFile ?? <ImageFieldView srcField={urlField} />

	return {
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		children,
		extractors,
		renderFilePreview,
		renderUploadedFile: renderUploadedImage,
		uploader,
		...rest,
	}
}
