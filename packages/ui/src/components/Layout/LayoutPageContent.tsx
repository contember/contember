import classNames from 'classnames'
import { memo } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { NativeProps } from '../../types'
import { toEnumClass } from '../../utils'

export interface LayoutPageContentProps extends NativeProps<HTMLDivElement> {
	/** @deprecated Use `pageContentLayout` instead */
	layout?: 'default' | 'full-width'
	pageContentLayout?: 'center' | 'start' | 'end' | 'stretch'
}

export const LayoutPageContent = memo(({ children, layout, pageContentLayout = 'center' }: LayoutPageContentProps) => {
	const componentClassName = useComponentClassName('layout-page-content')

	if (import.meta.env.DEV && layout) {
		console.warn('The `layout` prop is deprecated, use `pageContentLayout` prop instead')
	}

	if (layout === 'full-width' && !pageContentLayout) {
		pageContentLayout = 'stretch'
	}

	return <div className={componentClassName}>
		<div className={classNames(
			`${componentClassName}-container`,
			toEnumClass('layout-', pageContentLayout ?? layout),
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
