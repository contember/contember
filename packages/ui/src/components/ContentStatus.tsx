import cn from 'classnames'
import type { ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { Icon } from './Icon'

export interface ContentStatusProps {
	boxLabel?: ReactNode
}

export function ContentStatus({ boxLabel }: ContentStatusProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}contentStatus`)}>
			<span className={`${prefix}contentStatus-label`}>{boxLabel}</span>
			<span className={`${prefix}contentStatus-icon`}>
				<Icon contemberIcon="clock" alignWithLowercase />
			</span>
		</div>
	)
}
ContentStatus.displayName = 'ContentStatus'
