import type { AggregateDataPopulatorProps } from './AggregateDataPopulatorProps'
import { AudioFileMetadataPopulator } from './AudioFileMetadataPopulator'
import type { FileDataPopulator } from './FileDataPopulator'
import { FileUrlDataPopulator } from './FileUrlDataPopulator'
import { GenericFileMetadataPopulator } from './GenericFileMetadataPopulator'
import { ImageFileMetadataPopulator } from './ImageFileMetadataPopulator'
import { VideoFileMetadataPopulator } from './VideoFileMetadataPopulator'

// !!!!!!!! WARNING !!!!!!!!
// If you change *ANY* props access inside this function, you *MUST* also update the dependency array below in
// useResolvedPopulators
// !!!!!!!! WARNING !!!!!!!!
export const getDefaultPopulators = (props: AggregateDataPopulatorProps): FileDataPopulator[] => [
	...(props.additionalFileDataPopulators || []),
	new AudioFileMetadataPopulator({
		audioDurationField: props.audioDurationField,
	}),
	new FileUrlDataPopulator({
		fileUrlField: props.fileUrlField,
		imageFileUrlField: props.imageFileUrlField,
		videoFileUrlField: props.videoFileUrlField,
		audioFileUrlField: props.audioFileUrlField,
	}),
	new GenericFileMetadataPopulator({
		lastModifiedField: props.lastModifiedField,
		fileNameField: props.fileNameField,
		fileSizeField: props.fileSizeField,
		fileTypeField: props.fileTypeField,
	}),
	new ImageFileMetadataPopulator({
		imageHeightField: props.imageHeightField,
		imageWidthField: props.imageWidthField,
	}),
	new VideoFileMetadataPopulator({
		videoDurationField: props.videoDurationField,
		videoHeightField: props.videoHeightField,
		videoWidthField: props.videoWidthField,
	}),
]
