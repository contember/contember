import { Message } from '@contember/ui'
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

export interface EmptyMessageProps {
	children: ReactNode
}

export const EmptyMessage = memo((props: EmptyMessageProps) => <Message flow="generousBlock">{props.children}</Message>)
EmptyMessage.displayName = 'EmptyMessage'
