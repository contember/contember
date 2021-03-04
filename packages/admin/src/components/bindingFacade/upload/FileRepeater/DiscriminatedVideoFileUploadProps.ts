import { Scalar } from '@contember/binding'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { SugaredDiscriminateBy } from '../../discrimination'

export type DiscriminatedVideoFileUploadProps = {
	acceptVideo?: string | string[]
	renderVideoFile?: () => ReactNode
	renderVideoFilePreview?: (file: File, previewUrl: string) => ReactNode
} & (
	| {
			discriminateVideoBy?: SugaredDiscriminateBy
	  }
	| {
			discriminateVideoByScalar?: Scalar
	  }
)
