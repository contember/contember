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
import { useClassNamePrefix } from '../auxiliary'
import { ContemberLogo } from './ContemberLogo'
export interface LayoutHeadingProps {
	label?: ReactNode
}
export function LayoutHeading({ label }: LayoutHeadingProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}layoutHeading`}>
			<div className={`${prefix}layoutHeading-logo`}>
				<ContemberLogo size="large" logotype={!label} />
			</div>
			{label && <div className={`${prefix}layoutHeading-label`}>{label}</div>}
		</div>
	)
}
LayoutHeading.displayName = 'LayoutHeading'
