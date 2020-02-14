import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface BreadcrumbsProps {
	items: React.ReactNode[]
}

export const Breadcrumbs = React.memo<BreadcrumbsProps>(({ items }) => {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}breadcrumbs`}>
			<div className={`${prefix}breadcrumbs-items`}>
				{items.map((item, i) => (
					<span className={`${prefix}breadcrumbs-item`} key={i}>
						{item}
					</span>
				))}
			</div>
		</div>
	)
})
Breadcrumbs.displayName = 'Breadcrumbs'
