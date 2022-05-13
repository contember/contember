import { ReactChild } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { Icon } from '../../Icon'
import { Button } from '../Button'

interface SelectCreateNewWrapperProps {
	onClick?: () => void
	children: ReactChild
}

export const SelectCreateNewWrapper = ({ onClick, children }: SelectCreateNewWrapperProps) => {
	const prefix = useClassNamePrefix()
	if (!onClick) {
		return <>{children}</>
	}
	return (
		<div className={`${prefix}selectCreateNewWrapper`}>
			<div className={`${prefix}selectCreateNewWrapper-control`}>
				{children}
			</div>
			<div className={`${prefix}selectCreateNewWrapper-button`}>
				<Button onClick={onClick} elevation="none" intent="default"><Icon blueprintIcon={'plus'}/></Button>
			</div>
		</div>
	)
}
