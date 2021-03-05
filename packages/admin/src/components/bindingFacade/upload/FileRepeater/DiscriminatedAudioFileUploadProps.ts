import { ReactNode } from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedAudioFileUploadProps = {
	acceptAudio?: string | string[]
	renderAudioFile?: () => ReactNode
	renderAudioFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateAudioBy?: SugaredDiscriminateBy
}
