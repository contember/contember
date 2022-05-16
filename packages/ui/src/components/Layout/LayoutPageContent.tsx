import classNames from 'classnames'
import { memo } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { NativeProps } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface LayoutPageContentProps extends NativeProps<HTMLDivElement> {
	layout?: 'default' | 'full-width'
}

export const LayoutPageContent = memo(({ children, layout }: LayoutPageContentProps) => {
	const componentClassName = useComponentClassName('layout-page-content')

	return <div className={componentClassName}>
		<div className={classNames(
			`${componentClassName}-container`,
			toEnumViewClass(layout),
		)}>
			{children}
		</div>
	</div>
})
LayoutPageContent.displayName = 'LayoutPageContent'

/**
 * @deprecated Use `LayoutPageContent` instead
 */
export const PageLayoutContent = LayoutPageContent
