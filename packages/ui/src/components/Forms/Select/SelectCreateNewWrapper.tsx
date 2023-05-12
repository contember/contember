import { useClassNameFactory } from '@contember/utilities'
import { ReactNode } from 'react'
import { Icon } from '../../Icon'
import { Button } from '../Button'

export interface SelectCreateNewWrapperProps {
	onClick?: () => void
	children: ReactNode
}

export const SelectCreateNewWrapper = ({ onClick, children }: SelectCreateNewWrapperProps) => {
	const componentClassName = useClassNameFactory('selectCreateNewWrapper')

	if (!onClick) {
		return <>{children}</>
	}

	return (
		<div className={componentClassName()}>
			<div className={componentClassName('control')}>
				{children}
			</div>
			<div className={componentClassName('button')}>
				<Button onClick={onClick} elevation="none" intent="default"><Icon blueprintIcon="plus" /></Button>
			</div>
		</div>
	)
}
