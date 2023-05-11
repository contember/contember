import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface BreadcrumbsProps {
	items: ReactNode[]
}

/**
 * @group UI
 */
export const Breadcrumbs = memo<BreadcrumbsProps>(({ items }) => {
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
