import { useMessageFormatter } from '@contember/admin'
import { useUpdatedRef } from '@contember/react-utils'
import { visuallyHiddenStyle } from '@contember/ui'
import { Fragment, ReactNode, useCallback, useEffect, useRef } from 'react'

export type FocusScopeProps = {
	active?: boolean;
	pressToSkipToLastLabel?: string;
	pressToSkipToFirstLabel?: string;
	children: ReactNode;
}

const tabbingDirection = Object.freeze({
	FORWARDS: 'FORWARDS',
	BACKWARDS: 'BACKWARDS',
})

type TabbingDirection = typeof tabbingDirection[keyof typeof tabbingDirection]

export const focusScopeDictionary = {
	focusScope: {
		pressToSkipToLastLabel: 'Skip to last focusable element',
		pressToSkipToFirstLabel: 'Skip to first focusable element',
	},
}

const siblingMatch: Record<TabbingDirection, 'nextElementSibling' | 'previousElementSibling'> = {
	[tabbingDirection.FORWARDS]: 'nextElementSibling',
	[tabbingDirection.BACKWARDS]: 'previousElementSibling',
}

function maybeFocusElement(element: Element | null): boolean {
	if (element instanceof HTMLElement && 'focus' in element) {
		element.focus()

		return document.activeElement === element
	} else {
		return false
	}
}

function findFocusableElement(start: Element | null, direction: TabbingDirection): boolean {
	if (!start || !(start instanceof HTMLElement)) {
		return false
	}

	const childrenCount = start.children.length

	if (childrenCount > 0) {
		const index = direction === tabbingDirection.BACKWARDS ? childrenCount - 1 : 0

		for (let child of start.children) {
			if (maybeFocusElement(child)) {
				return true
			} else {
				if (findFocusableElement(start.children.item(index), direction)) {
					return true
				}
			}
		}
	}

	const sibling = start[siblingMatch[direction]]

	if (maybeFocusElement(sibling)) {
		return true
	} else {
		return findFocusableElement(sibling, direction)
	}
}

export function FocusScope({
	active = true,
	children,
	pressToSkipToLastLabel,
	pressToSkipToFirstLabel,
}: FocusScopeProps) {
	const formatter = useMessageFormatter(focusScopeDictionary)

	const activeRef = useUpdatedRef(active)
	const lastRef = useRef<HTMLButtonElement>(null)
	const firstRef = useRef<HTMLButtonElement>(null)

	const direction = useRef<TabbingDirection>(tabbingDirection.FORWARDS)

	const skipToFirst = useCallback(() => {
		direction.current = tabbingDirection.FORWARDS
		findFocusableElement(firstRef.current, direction.current)
	}, [])

	const skipToLast = useCallback(() => {
		direction.current = tabbingDirection.BACKWARDS
		findFocusableElement(lastRef.current, direction.current)
	}, [])

	const onFocus = useCallback(() => {
		if (activeRef.current) {
			if (direction.current === tabbingDirection.FORWARDS) {
				findFocusableElement(firstRef.current, direction.current)
			} else {
				findFocusableElement(lastRef.current, direction.current)
			}
		}
	}, [activeRef])

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Shift') {
				direction.current = tabbingDirection.BACKWARDS
			}
		}

		function handleKeyUp(event: KeyboardEvent) {
			if (event.key === 'Shift') {
				direction.current = tabbingDirection.FORWARDS
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		document.addEventListener('keyup', handleKeyUp)

		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.removeEventListener('keyup', handleKeyUp)
		}
	}, [])

	return (
		<Fragment key="focus-scope">
			{active && (
				<button style={visuallyHiddenStyle} ref={firstRef} onFocus={onFocus} onClick={skipToLast}>
					{pressToSkipToLastLabel ?? formatter('focusScope.pressToSkipToLastLabel')}
				</button>
			)}
			{children}
			{active && (
				<button style={visuallyHiddenStyle} ref={lastRef} onFocus={onFocus} onClick={skipToFirst}>
					{pressToSkipToFirstLabel ?? formatter('focusScope.pressToSkipToFirstLabel')}
				</button>
			)}
		</Fragment>
	)
}
