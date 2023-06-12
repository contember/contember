import { Identity2023 } from '@contember/brand'
import { useClassNameFactory } from '@contember/utilities'
import { ReactNode, useState } from 'react'
import { Icon } from '../Icon'

export const DevBar = ({ children }: { children: ReactNode }) => {
	const componentClassName = useClassNameFactory('devBar')
	const [closed, setClosed] = useState(false)
	if (closed) {
		return null
	}
	return (
		<div className={componentClassName()}>
			<a className={componentClassName('brand')} href="https://docs.contember.com/" target="_blank" rel="noreferrer">
				<Identity2023.LogoType />
			</a>
			<div className={componentClassName('panels')}>
				{children}
			</div>
			<div className={componentClassName('close')} onClick={() => setClosed(true)}>
				<Icon blueprintIcon="cross" />
			</div>
		</div>
	)
}

export const DevPanel = ({ heading, children, preview }: {
	heading: ReactNode,
	children: ReactNode,
	preview?: ReactNode
}) => {
	const componentClassName = useClassNameFactory('devBar')

	return (
		<div className={componentClassName('trigger')}>
			<div className={componentClassName('trigger-label')}>
				{preview ?? heading}
			</div>
			<div className={componentClassName('panel')}>
				<h1 className={componentClassName('panel-heading')}>
					{heading}
				</h1>
				<div className={componentClassName('panel-content')}>
					{children}
				</div>
			</div>
		</div>
	)
}
