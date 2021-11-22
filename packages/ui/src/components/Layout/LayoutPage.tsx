import { memo, ReactNode, useLayoutEffect, useRef } from 'react'
import { IncreaseHeadingDepth, useClassNamePrefix } from '../../auxiliary'
import { SectionTabs, useSectionTabsRegistration } from '../SectionTabs'
import { Stack } from '../Stack'
import { TitleBar, TitleBarProps } from '../TitleBar'

export const PageLayoutContent = ({ children }: { children: ReactNode }) => {
	const prefix = useClassNamePrefix()

	return <div className={`${prefix}layout-page-content`}>
		{children}
	</div>
}

export interface LayoutPageProps extends Omit<TitleBarProps, 'children'> {
	side?: ReactNode
	title?: ReactNode
	children?: ReactNode
}

const metaTab = {
	id: 'meta-section-aside',
	label: 'Meta',
	isMeta: true,
}

function isElementFixed (element: HTMLDivElement) {
  const offsetTop = element.offsetTop
  const offsetHeight = element.offsetHeight
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight

  return offsetTop === scrollTop && offsetHeight === scrollHeight
}

const Aside = memo(({ children }: { children: ReactNode }) => {
	const prefix = useClassNamePrefix()
	const [registerTab, unregisterTab] = useSectionTabsRegistration()
	const element = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		const tabRegistration = () => {
			if (element.current) {
				const isFixed = isElementFixed(element.current)

				if (!isFixed) {
					registerTab(metaTab)
				} else {
					unregisterTab(metaTab)
				}
			} else {
				console.error('Missing element')
			}
		}

		window.addEventListener('resize', tabRegistration)
		tabRegistration()

		return () => {
			unregisterTab(metaTab)
			window.removeEventListener('resize', tabRegistration)
		}
	})

	return <div ref={element} id={metaTab.id} className={`${prefix}layout-page-aside`}>
		<Stack depth={2} direction="vertical">
			{children}
		</Stack>
	</div>
})


export const LayoutPage = memo(({
	side,
	children,
	title,
	navigation,
	actions,
	headingProps,
}: LayoutPageProps) => {
	const prefix = useClassNamePrefix()

	return <div className={`${prefix}layout-page-wrap`}>
		{!!title && (
			<TitleBar after={<SectionTabs />} navigation={navigation} actions={actions} headingProps={headingProps}>
				{title}
			</TitleBar>
		)}
		<div className={`${prefix}layout-page-content-wrap`}>
			<PageLayoutContent>
				<IncreaseHeadingDepth currentDepth={1}>
					{children}
				</IncreaseHeadingDepth>
			</PageLayoutContent>
			{side && <Aside>{side}</Aside>}
		</div>
	</div>
})

LayoutPage.displayName = 'LayoutPage'
