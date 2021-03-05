import cn from 'classnames'
import { ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { Icon } from './Icon'

export interface ContentStatusProps {
	label?: ReactNode
}

export function ContentStatus({ label }: ContentStatusProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}contentStatus`)}>
			<span className={`${prefix}contentStatus-label`}>{label}</span>
			<span className={`${prefix}contentStatus-icon`}>
				<Icon contemberIcon="clock" alignWithLowercase />
			</span>
		</div>
	)
}
ContentStatus.displayName = 'ContentStatus'
