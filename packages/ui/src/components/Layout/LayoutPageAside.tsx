import { useClassNameFactory } from '@contember/utilities'
import { memo, useLayoutEffect, useRef } from 'react'
import { HTMLDivElementProps } from '../../types'
import { useSectionTabsRegistration } from '../SectionTabs'
import { Stack } from '../Stack'

const metaTab = {
	id: 'meta-section-aside',
	label: 'Meta',
	isMeta: true,
}

/**
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
			<Stack gap="large" direction="vertical" className={componentClassName('content')}>
				{children}
			</Stack>
		</div>
	)
})
LayoutPageAside.displayName = 'LayoutPageAside'
