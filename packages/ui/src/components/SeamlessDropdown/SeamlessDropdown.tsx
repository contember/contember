import { useClassNameFactory } from '@contember/utilities'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useCloseOnClickOutside, useCloseOnEscape } from '../../auxiliary'
import { Default } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import { Stack } from '../Stack'

export type SeamlessDropdownDirection = Default | 'down' | 'up'
export interface SeamlessDropdownProps {
	label: ReactNode
	children?: ReactNode
	hoverable?: boolean
	inline?: boolean
	caret?: boolean
	direction?: SeamlessDropdownDirection
}

export function SeamlessDropdown({ direction = 'down', label, children, hoverable, caret, inline }: SeamlessDropdownProps) {
	const componentClassName = useClassNameFactory('seamlessDropdown')
	const [open, setOpen] = useState(false)

	const toggleOpen = useCallback(() => {
		setOpen(open => !open)
	}, [])

	const close = useCallback(() => {
		setOpen(false)
	}, [])

	useCloseOnEscape(({ isOpen: open, close }))

	const [buttonRef, setButtonRef] = useState<HTMLDivElement | null>(null)
	const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null)
	const contents = useMemo(() => [buttonRef, contentRef], [buttonRef, contentRef])
	useCloseOnClickOutside({ isOpen: open, close, contents: contents })

	const buttonIn = (
		<div className={componentClassName('button-in')} onClick={hoverable ? undefined : toggleOpen}>
			{label}
		</div>
	)
	return (
		<div
			className={componentClassName(null, [
				toEnumViewClass(direction),
				toViewClass('open', open),
				toViewClass('hoverable', hoverable),
				toViewClass('caret', caret),
				toViewClass('inline', inline),
			])}
		>
			<div className={componentClassName('button')} ref={setButtonRef}>
				{buttonIn}
			</div>
			<div className={componentClassName('content')} ref={setContentRef}>
				{buttonIn}
				<div className={componentClassName('content-sep')}></div>
				<Stack direction="vertical" gap="small" className={componentClassName('content-in')}>{children}</Stack>
			</div>
		</div>
	)
}
SeamlessDropdown.displayName = 'SeamlessDropdown'
