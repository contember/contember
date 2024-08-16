import { FileUrlDataExtractorProps, GenericFileMetadataExtractorProps, getFileUrlDataExtractor, getGenericFileMetadataExtractor, getVideoFileDataExtractor, VideoFileDataExtractorProps } from '../extractors'
import { FileType } from '../types'

export type VideoFileTypeProps =
	& FileType
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& VideoFileDataExtractorProps

export const createVideoFileType = ({
	urlField,
	durationField,
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	heightField,
	widthField,
	extractors,
	acceptFile,
	accept,
	uploader,
}: VideoFileTypeProps): FileType => {
	return {
		accept: accept ?? { 'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.mkv', '.3gp'] },
		acceptFile,
		uploader,
		extractors: [
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getVideoFileDataExtractor({ heightField, widthField, durationField }),
			getFileUrlDataExtractor({ urlField }),
			...extractors ?? [],
		],
	}
}
