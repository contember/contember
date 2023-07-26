import { useClassNameFactory } from '@contember/react-utils'
import { PlusIcon } from 'lucide-react'
import { ReactNode } from 'react'
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
				<Button square onClick={onClick} intent="default"><PlusIcon /></Button>
			</div>
		</div>
	)
}
