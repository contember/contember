import cn from 'classnames'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useClassNamePrefix, useCloseOnClickOutside, useCloseOnEscape } from '../../auxiliary'
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
	const prefix = useClassNamePrefix()
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
		<div className={cn(`${prefix}seamlessDropdown-button-in`)} onClick={hoverable ? undefined : toggleOpen}>
			{label}
		</div>
	)
	return (
		<div
			className={cn(
				`${prefix}seamlessDropdown`,
				toEnumViewClass(direction),
				toViewClass('open', open),
				toViewClass('hoverable', hoverable),
				toViewClass('caret', caret),
				toViewClass('inline', inline),
			)}
		>
			<div className={cn(`${prefix}seamlessDropdown-button`)} ref={setButtonRef}>
				{buttonIn}
			</div>
			<div className={cn(`${prefix}seamlessDropdown-content`)} ref={setContentRef}>
				{buttonIn}
				<div className={cn(`${prefix}seamlessDropdown-content-sep`)}></div>
				<Stack direction="vertical" gap="small" className={cn(`${prefix}seamlessDropdown-content-in`)}>{children}</Stack>
			</div>
		</div>
	)
}
SeamlessDropdown.displayName = 'SeamlessDropdown'
