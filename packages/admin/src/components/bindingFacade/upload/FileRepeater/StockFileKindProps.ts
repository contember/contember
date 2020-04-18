import { DiscriminatedAudioFileUploadProps } from './DiscriminatedAudioFileUploadProps'
import { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'
import { DiscriminatedGenericFileUploadProps } from './DiscriminatedGenericFileUploadProps'
import { DiscriminatedImageFileUploadProps } from './DiscriminatedImageFileUploadProps'
import { DiscriminatedVideoFileUploadProps } from './DiscriminatedVideoFileUploadProps'

export type StockFileKindProps = {
	additionalFileKinds?: Iterable<DiscriminatedFileUploadProps>
} & DiscriminatedImageFileUploadProps &
	DiscriminatedAudioFileUploadProps &
	DiscriminatedVideoFileUploadProps &
	DiscriminatedGenericFileUploadProps
