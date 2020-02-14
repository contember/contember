import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix, useCloseOnEscapeOrClickOutside } from '../auxiliary'

export interface SaveControlProps {
	primaryAction?: React.ReactNode
	onPrimary?: () => void
	children?: React.ReactNode
}

export function SaveControl({ primaryAction, children, onPrimary }: SaveControlProps) {
	const prefix = useClassNamePrefix()
	const [open, setOpen] = React.useState(false)

	const toggleOpen = React.useCallback(() => {
		setOpen(open => !open)
	}, [])

	const close = React.useCallback(() => {
		setOpen(false)
	}, [])

	const refs = useCloseOnEscapeOrClickOutside<HTMLDivElement, HTMLDivElement>(open, close)

	return (
		<div className={cn(`${prefix}saveControl`, open && 'view-open')}>
			<div className={cn(`${prefix}saveControl-button`)} ref={refs.buttonRef}>
				<button type="button" className={cn(`${prefix}saveControl-button-primary`)} onClick={onPrimary}>
					<div className={cn(`${prefix}saveControl-button-label`)}>{primaryAction || 'Save'}</div>
				</button>
				{children && <button type="button" className={cn(`${prefix}saveControl-button-toggle`)} onClick={toggleOpen} />}
			</div>

			{children && (
				<div className={cn(`${prefix}saveControl-window`)} ref={refs.contentRef}>
					<div className={cn(`${prefix}saveControl-window-in`)}>{children}</div>
				</div>
			)}
		</div>
	)
}
SaveControl.displayName = 'SaveControl'
