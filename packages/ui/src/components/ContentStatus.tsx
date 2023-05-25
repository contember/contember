import { useClassNameFactory } from '@contember/utilities'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

export interface ContentStatusProps {
	label?: ReactNode
}

export function ContentStatus({ label }: ContentStatusProps) {
	const componentClassName = useClassNameFactory('contentStatus')

	return (
		<div className={componentClassName()}>
			<span className={componentClassName('label')}>{label}</span>
			<span className={componentClassName('icon')}>
				<Icon contemberIcon="clock" alignWithLowercase />
			</span>
		</div>
	)
}
ContentStatus.displayName = 'ContentStatus'
