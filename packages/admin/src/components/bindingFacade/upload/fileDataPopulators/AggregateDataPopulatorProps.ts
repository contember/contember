import { AudioFileMetadataPopulatorProps } from './AudioFileMetadataPopulator'
import { FileDataPopulator } from './FileDataPopulator'
import { FileUrlDataPopulatorProps } from './FileUrlDataPopulator'
import { GenericFileMetadataPopulatorProps } from './GenericFileMetadataPopulator'
import { ImageFileMetadataPopulatorProps } from './ImageFileMetadataPopulator'
import { VideoFileMetadataPopulatorProps } from './VideoFileMetadataPopulator'

export interface AggregateDataPopulatorProps
	extends AudioFileMetadataPopulatorProps,
		FileUrlDataPopulatorProps,
		GenericFileMetadataPopulatorProps,
		ImageFileMetadataPopulatorProps,
		VideoFileMetadataPopulatorProps {
	additionalFileDataPopulators?: Iterable<FileDataPopulator>
}
