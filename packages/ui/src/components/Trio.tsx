import { useClassNameFactory } from '@contember/utilities'
import type { ReactNode } from 'react'
import { toViewClass } from '../utils'

export function Trio({
	className,
	column,
	start,
	center,
	end,
	clickThroughSpace,
}: {
	column?: boolean
	className?: string
	start?: ReactNode
	center?: ReactNode
	end?: ReactNode
	clickThroughSpace?: boolean
}) {
	const componentClassName = useClassNameFactory('trio')

	if (!start && !center && !end) {
		return null
	}
	return (
		<div
			className={componentClassName(null, [
				className,
				toViewClass('column', column),
				toViewClass('clickThroughSpace', clickThroughSpace),
			])}
		>
			<div className={componentClassName('start')}>{start}</div>
			<div className={componentClassName('center')}>{center}</div>
			<div className={componentClassName('end')}>{end}</div>
		</div>
	)
}
Trio.displayName = 'Trio'
