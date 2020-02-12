import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix, useCloseOnEscapeOrClickOutside } from '../auxiliary'

export interface SaveControlProps {}

export function SaveControl({}: SaveControlProps) {
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
				<button type="button" className={cn(`${prefix}saveControl-button-primary`)}>
					<div className={cn(`${prefix}saveControl-button-label`)}>Save</div>
				</button>
				<button type="button" className={cn(`${prefix}saveControl-button-toggle`)} onClick={toggleOpen} />
			</div>

			<div className={cn(`${prefix}saveControl-window`)} ref={refs.contentRef}>
				<div className={cn(`${prefix}saveControl-window-in`)}>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer egestas tempor ipsum, sit amet pulvinar mi
					hendrerit vel. Morbi suscipit turpis eu tincidunt interdum. Suspendisse potenti. Suspendisse sagittis aliquam
					egestas. Suspendisse id condimentum nisi. Phasellus vel nibh non turpis venenatis egestas quis ac orci. Mauris
					magna magna, cursus quis mi eget, congue luctus lorem. Pellentesque nunc diam, pellentesque ac nunc aliquet,
					mattis sagittis orci. Donec vehicula feugiat viverra. Vivamus vestibulum ligula vitae placerat fermentum.
					Morbi vel purus quis nisl auctor sagittis.
				</div>
			</div>
		</div>
	)
}
SaveControl.displayName = 'SaveControl'
