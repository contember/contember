import type { AudioFileMetadataPopulatorProps } from './AudioFileMetadataPopulator'
import type { FileDataPopulator } from './FileDataPopulator'
import type { FileUrlDataPopulatorProps } from './FileUrlDataPopulator'
import type { GenericFileMetadataPopulatorProps } from './GenericFileMetadataPopulator'
import type { ImageFileMetadataPopulatorProps } from './ImageFileMetadataPopulator'
import type { VideoFileMetadataPopulatorProps } from './VideoFileMetadataPopulator'

export interface AggregateDataPopulatorProps
	extends AudioFileMetadataPopulatorProps,
		FileUrlDataPopulatorProps,
		GenericFileMetadataPopulatorProps,
		ImageFileMetadataPopulatorProps,
		VideoFileMetadataPopulatorProps {
	additionalFileDataPopulators?: Iterable<FileDataPopulator>
}
