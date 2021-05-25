import type { ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedVideoFileUploadProps = {
	acceptVideo?: string | string[]
	renderVideoFile?: () => ReactNode
	renderVideoFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateVideoBy?: SugaredDiscriminateBy
}
