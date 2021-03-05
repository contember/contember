import { SugaredRelativeSingleField } from '@contember/binding'
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

export type FieldBackedElement = {
	field: SugaredRelativeSingleField | string
	placeholder: ReactNode
	render: (props: { isEmpty: boolean; children: ReactNode }) => ReactNode
} & (
	| {
			format: 'richText'
			// TODO specific settings
	  }
	| {
			format: 'plainText'
	  }
)
