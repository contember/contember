import { useClassNameFactory } from '@contember/utilities'
import { memo, ReactNode } from 'react'

export interface BreadcrumbsProps {
	items: ReactNode[]
}

/**
 * @group UI
 */
export const Breadcrumbs = memo<BreadcrumbsProps>(({ items }) => {
	const componentClassName = useClassNameFactory('breadcrumbs')

	return (
		<div className={componentClassName()}>
			<div className={componentClassName('items')}>
				{items.map((item, i) => (
					<span className={componentClassName('item')} key={i}>
						{item}
					</span>
				))}
			</div>
		</div>
	)
})
Breadcrumbs.displayName = 'Breadcrumbs'
