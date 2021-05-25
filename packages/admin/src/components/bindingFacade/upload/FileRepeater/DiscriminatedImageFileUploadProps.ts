import type { ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedImageFileUploadProps = {
	acceptImage?: string | string[]
	renderImageFile?: () => ReactNode
	renderImageFilePreview?: (file: File, previewUrl: string) => ReactNode
	discriminateImageBy?: SugaredDiscriminateBy
}
