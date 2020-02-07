import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'
import useOnClickOutside from 'use-onclickoutside'

export interface SaveControlProps {}

export function SaveControl({}: SaveControlProps) {
	const prefix = useClassNamePrefix()
	const [open, setOpen] = React.useState(false)

	const toggleOpen = React.useCallback(() => {
		setOpen(!open)
	}, [open, setOpen])

	const close = React.useCallback(() => {
		setOpen(false)
	}, [setOpen])

	const ref = React.useRef(null)
	useOnClickOutside(ref, close)

	return (
		<div className={cn(`${prefix}saveControl`, open && 'view-open')} ref={ref}>
			<div className={cn(`${prefix}saveControl-button`)}>
				<button type="button" className={cn(`${prefix}saveControl-button-primary`)}>
					<div className={cn(`${prefix}saveControl-button-label`)}>Save</div>
				</button>
				<button type="button" className={cn(`${prefix}saveControl-button-toggle`)} onClick={toggleOpen}></button>
			</div>

			<div className={cn(`${prefix}saveControl-window`)}>
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
