import { Scalar } from '@contember/binding'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedAudioFileUploadProps = {
	acceptAudio?: string | string[]
	renderAudioFile?: () => ReactNode
	renderAudioFilePreview?: (file: File, previewUrl: string) => ReactNode
} & (
	| {
			discriminateAudioBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateAudioByScalar?: Scalar
	  }
)
