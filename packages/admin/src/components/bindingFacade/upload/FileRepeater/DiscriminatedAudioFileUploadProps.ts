import type { ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../discrimination'

export interface DiscriminatedAudioFileUploadProps {
	acceptAudio?: string | string[]
	renderAudioFile?: () => ReactNode
	renderAudioFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateAudioBy?: SugaredDiscriminateBy
}
