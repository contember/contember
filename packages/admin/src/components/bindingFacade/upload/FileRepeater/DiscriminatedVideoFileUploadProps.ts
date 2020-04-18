import { Scalar } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy } from '../../blocks'

export type DiscriminatedVideoFileUploadProps = {
	renderVideoFile?: () => React.ReactNode
	renderVideoFilePreview?: (file: File, previewUrl: string) => React.ReactNode
} & (
	| {
			discriminateVideoBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateVideoByScalar?: Scalar
	  }
)
