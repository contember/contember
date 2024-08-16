import { FileUrlDataExtractorProps, GenericFileMetadataExtractorProps, getFileUrlDataExtractor, getGenericFileMetadataExtractor } from '../extractors'
import { FileType } from '../types'

export type AnyFileTypeProps =
	& FileType
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps

export const createAnyFileType = ({
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	urlField,
	uploader,
	extractors,
	acceptFile,
	accept,
}: AnyFileTypeProps): FileType => {
	return {
		uploader,
		acceptFile,
		accept,
		extractors: [
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getFileUrlDataExtractor({ urlField }),
			...extractors ?? [],
		],
	}
}
