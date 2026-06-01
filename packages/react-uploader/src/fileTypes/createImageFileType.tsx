import {
	FileUrlDataExtractorProps,
	GenericFileMetadataExtractorProps,
	getFileUrlDataExtractor,
	getGenericFileMetadataExtractor,
	getImageFileDataExtractor,
	ImageFileDataExtractorProps,
} from '../extractors/index.js'
import { FileType, FileWithMeta } from '../types/index.js'

export type ImageFileTypeProps =
	& FileType
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& ImageFileDataExtractorProps

export const createImageFileType = ({
	uploader,
	urlField,
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	heightField,
	widthField,
	accept,
	acceptFile,
	extractors,
}: ImageFileTypeProps): FileType => {
	return {
		accept: accept ?? { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
		acceptFile,
		uploader,
		extractors: [
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getImageFileDataExtractor({ heightField, widthField }),
			getFileUrlDataExtractor({ urlField }),
			...extractors ?? [],
		],
	}
}
