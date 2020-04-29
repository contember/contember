import { Scalar } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedAudioFileUploadProps = {
	acceptAudio?: string | string[]
	renderAudioFile?: () => React.ReactNode
	renderAudioFilePreview?: (file: File, previewUrl: string) => React.ReactNode
} & (
	| {
			discriminateAudioBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateAudioByScalar?: Scalar
	  }
)
