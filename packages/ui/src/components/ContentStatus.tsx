import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'

export interface ContentStatusProps {}

export function ContentStatus({}: ContentStatusProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}contentStatus`)}>
			<span className={`${prefix}contentStatus-label`}>Concept, unsaved</span>
			<span className={`${prefix}contentStatus-icon`}></span>
		</div>
	)
}
ContentStatus.displayName = 'ContentStatus'
