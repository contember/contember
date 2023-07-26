import { useClassNameFactory } from '@contember/react-utils'
import { memo, useLayoutEffect, useRef } from 'react'
import { useSectionTabsRegistration } from '../../components/SectionTabs'
import { Stack } from '../../components/Stack'
import { HTMLDivElementProps } from '../../types'

const metaTab = {
	id: 'meta-section-aside',
	label: 'Meta',
}

/**
 * @deprecated Use `LayoutKit` from `@contember/layout` instead.
 * @group Layout UI
 */
export const LayoutPageAside = memo(({ children }: HTMLDivElementProps) => {
	const componentClassName = useClassNameFactory('layout-page-aside')
	const [registerTab, unregisterTab] = useSectionTabsRegistration()
	const element = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		const mediaQueryList = matchMedia('(min-width: 1280px)')

		const tabRegistration = () => {
			if (element.current) {
				if (!mediaQueryList.matches) {
					registerTab(metaTab)
				} else {
					unregisterTab(metaTab)
				}
			} else {
				console.error('Missing element')
			}
		}

		tabRegistration()

		mediaQueryList.addEventListener('change', tabRegistration)

		return () => {
			unregisterTab(metaTab)
			mediaQueryList.removeEventListener('change', tabRegistration)
		}
	})

	return (
		<div ref={element} id={metaTab.id} className={componentClassName()}>
			<Stack gap="large" className={componentClassName('content')}>
				{children}
			</Stack>
		</div>
	)
})
LayoutPageAside.displayName = 'LayoutPageAside'
