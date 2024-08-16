import { AudioFileDataExtractorProps, FileUrlDataExtractorProps, GenericFileMetadataExtractorProps, getAudioFileDataExtractor, getFileUrlDataExtractor, getGenericFileMetadataExtractor } from '../extractors'
import { FileType } from '../types'

export type AudioFileTypeProps =
	& FileType
	& FileUrlDataExtractorProps
	& GenericFileMetadataExtractorProps
	& AudioFileDataExtractorProps

export const createAudioFileType = ({
	durationField,
	fileSizeField,
	fileTypeField,
	lastModifiedField,
	fileNameField,
	urlField,
	uploader,
	extractors,
	acceptFile,
	accept,
}: AudioFileTypeProps): FileType => {
	return {
		accept: accept ?? { 'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma', '.aiff'] },
		acceptFile,
		uploader,
		extractors: [
			getGenericFileMetadataExtractor({ fileNameField, fileSizeField, fileTypeField, lastModifiedField }),
			getAudioFileDataExtractor({ durationField }),
			getFileUrlDataExtractor({ urlField }),
			...extractors ?? [],
		],
	}
}
