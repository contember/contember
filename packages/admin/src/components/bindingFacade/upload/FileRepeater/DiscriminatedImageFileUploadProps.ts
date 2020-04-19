import { Scalar } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy } from '../../blocks'

export type DiscriminatedImageFileUploadProps = {
	acceptImage?: string | string[]
	renderImageFile?: () => React.ReactNode
	renderImageFilePreview?: (file: File, previewUrl: string) => React.ReactNode
} & (
	| {
			discriminateImageBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateImageByScalar?: Scalar
	  }
)
