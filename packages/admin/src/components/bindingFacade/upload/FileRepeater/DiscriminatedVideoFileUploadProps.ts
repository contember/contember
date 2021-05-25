import type { ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../discrimination'

export interface DiscriminatedVideoFileUploadProps {
	acceptVideo?: string | string[]
	renderVideoFile?: () => ReactNode
	renderVideoFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateVideoBy?: SugaredDiscriminateBy
}
