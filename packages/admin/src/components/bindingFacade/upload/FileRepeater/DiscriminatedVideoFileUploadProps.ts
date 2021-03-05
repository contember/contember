import { ReactNode } from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedVideoFileUploadProps = {
	acceptVideo?: string | string[]
	renderVideoFile?: () => ReactNode
	renderVideoFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateVideoBy?: SugaredDiscriminateBy
}
