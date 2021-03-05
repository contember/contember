import {
	ReactNode,
	ReactElement,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	ComponentType,
	MouseEvent as ReactMouseEvent,
	memo,
	useState,
	useContext,
} from 'react'
import ReactDOM from 'react-dom'

export interface PortalProps {
	to?: HTMLElement
	children: ReactNode
}

export const Portal = memo((props: PortalProps) => ReactDOM.createPortal(props.children, props.to ?? document.body))
Portal.displayName = 'Portal'
