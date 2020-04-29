import { Scalar } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedVideoFileUploadProps = {
	acceptVideo?: string | string[]
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
