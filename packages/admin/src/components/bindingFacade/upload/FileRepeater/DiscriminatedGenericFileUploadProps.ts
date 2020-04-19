import { Scalar } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy } from '../../blocks'

export type DiscriminatedGenericFileUploadProps = {
	acceptGeneric?: string | string[]
	renderGenericFile?: () => React.ReactNode
	renderGenericFilePreview?: (file: File, previewUrl: string) => React.ReactNode
} & (
	| {
			discriminateGenericBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateGenericByScalar?: Scalar
	  }
)
