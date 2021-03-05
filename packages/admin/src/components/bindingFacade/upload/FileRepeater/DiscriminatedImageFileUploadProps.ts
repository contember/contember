import { Scalar } from '@contember/binding'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedImageFileUploadProps = {
	acceptImage?: string | string[]
	renderImageFile?: () => ReactNode
	renderImageFilePreview?: (file: File, previewUrl: string) => ReactNode
} & (
	| {
			discriminateImageBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateImageByScalar?: Scalar
	  }
)
