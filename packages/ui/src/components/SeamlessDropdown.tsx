import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix, useCloseOnEscapeOrClickOutside } from '../auxiliary'
import { toViewClass } from '../utils'

export interface SeamlessDropdownProps {
	label: React.ReactNode
	children?: React.ReactNode
	hoverable?: boolean
	inline?: boolean
	caret?: boolean
}

export function SeamlessDropdown({ label, children, hoverable, caret, inline }: SeamlessDropdownProps) {
	const prefix = useClassNamePrefix()
	const [open, setOpen] = React.useState(false)

	const toggleOpen = React.useCallback(() => {
		setOpen(open => !open)
	}, [])

	const close = React.useCallback(() => {
		setOpen(false)
	}, [])

	const refs = useCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>(open, close)

	const buttonIn = (
		<div className={cn(`${prefix}seamlessDropdown-button-in`)} onClick={hoverable ? undefined : toggleOpen}>
			{label}
		</div>
	)
	return (
		<div
			className={cn(
				`${prefix}seamlessDropdown`,
				toViewClass('open', open),
				toViewClass('hoverable', hoverable),
				toViewClass('caret', caret),
				toViewClass('inline', inline),
			)}
		>
			<div className={cn(`${prefix}seamlessDropdown-button`)} ref={refs.buttonRef}>
				{buttonIn}
			</div>
			<div className={cn(`${prefix}seamlessDropdown-content`)} ref={refs.contentRef}>
				{buttonIn}
				<div className={cn(`${prefix}seamlessDropdown-content-sep`)}></div>
				<div className={cn(`${prefix}seamlessDropdown-content-in`)}>{children}</div>
			</div>
		</div>
	)
}
SeamlessDropdown.displayName = 'SeamlessDropdown'
