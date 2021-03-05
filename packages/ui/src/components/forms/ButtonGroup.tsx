import cn from 'classnames'
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
import { useComponentClassName } from '../../auxiliary'
import { ButtonGroupFlow, ButtonGroupOrientation, Size } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'

export interface ButtonGroupProps {
	children?: ReactNode
	size?: Size
	orientation?: ButtonGroupOrientation
	flow?: ButtonGroupFlow
	isTopToolbar?: boolean
}

export const ButtonGroup = memo(({ size, flow, orientation, isTopToolbar, children }: ButtonGroupProps) => (
	<div
		className={cn(
			useComponentClassName('button-group'),
			toEnumViewClass(size),
			toEnumViewClass(flow),
			toEnumViewClass(orientation, 'horizontal'),
			toViewClass('isTopToolbar', isTopToolbar),
		)}
		role="group"
	>
		{children}
	</div>
))
ButtonGroup.displayName = 'ButtonGroup'
