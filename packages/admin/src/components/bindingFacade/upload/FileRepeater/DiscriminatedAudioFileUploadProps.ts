import type { ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedAudioFileUploadProps = {
	acceptAudio?: string | string[]
	renderAudioFile?: () => ReactNode
	renderAudioFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateAudioBy?: SugaredDiscriminateBy
}
