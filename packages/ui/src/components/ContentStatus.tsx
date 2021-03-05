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
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'
import { Icon } from './Icon'

export interface ContentStatusProps {
	label?: ReactNode
}

export function ContentStatus({ label }: ContentStatusProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}contentStatus`)}>
			<span className={`${prefix}contentStatus-label`}>{label}</span>
			<span className={`${prefix}contentStatus-icon`}>
				<Icon contemberIcon="clock" alignWithLowercase />
			</span>
		</div>
	)
}
ContentStatus.displayName = 'ContentStatus'
