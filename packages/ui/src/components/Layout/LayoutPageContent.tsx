import { memo } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { NativeProps } from '../../types'

export const LayoutPageContent = memo(({ children }: NativeProps<HTMLDivElement>) => {
	const componentClassName = useComponentClassName('layout-page-content')

	return <div
		className={componentClassName}>
		<div className={`${componentClassName}-container`}>
			{children}
		</div>
	</div>
})
LayoutPageContent.displayName = 'LayoutPageContent'

/**
 * @deprecated Use `LayoutPageContent` instead
 */
export const PageLayoutContent = LayoutPageContent
