import type { DiscriminatedAudioFileUploadProps } from './DiscriminatedAudioFileUploadProps'
import type { DiscriminatedFileUploadProps } from './DiscriminatedFileUploadProps'
import type { DiscriminatedGenericFileUploadProps } from './DiscriminatedGenericFileUploadProps'
import type { DiscriminatedImageFileUploadProps } from './DiscriminatedImageFileUploadProps'
import type { DiscriminatedVideoFileUploadProps } from './DiscriminatedVideoFileUploadProps'

export type StockFileKindProps = {
	additionalFileKinds?: Iterable<DiscriminatedFileUploadProps>
} & DiscriminatedImageFileUploadProps &
	DiscriminatedAudioFileUploadProps &
	DiscriminatedVideoFileUploadProps &
	DiscriminatedGenericFileUploadProps
