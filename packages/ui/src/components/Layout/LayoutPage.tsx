import classNames from 'classnames'
import { CSSProperties, memo, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toEnumClass, toThemeClass } from '../../utils'
import { SectionTabs, useSectionTabsRegistration } from '../SectionTabs'
import { Stack } from '../Stack'
import { TitleBar, TitleBarProps } from '../TitleBar'
import { useThemeScheme } from './ThemeSchemeContext'
import { ThemeScheme } from './Types'

export const PageLayoutContent = ({ children }: { children: ReactNode }) => {
	const prefix = useClassNamePrefix()

	return <div
		className={`${prefix}layout-page-content`}>
		<div className={`${prefix}layout-page-content-container`}>
			{children}
		</div>
	</div>
}

export interface LayoutPageProps extends Omit<TitleBarProps, 'children'>, ThemeScheme {
	children?: ReactNode
	side?: ReactNode
	title?: ReactNode
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
	const componentClassName = `${useClassNamePrefix()}layout-page-aside`
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

	return <div ref={element} id={metaTab.id} className={componentClassName}>
		<Stack gap="large" direction="vertical" className={`${componentClassName}-content`}>
			{children}
		</Stack>
	</div>
})

export const LayoutPage = memo(({
	after,
	actions,
	children,
	headingProps,
	navigation,
	side,
	title,
	...props
}: LayoutPageProps) => {
	const prefix = useClassNamePrefix()
	const {
		scheme,
		theme,
		themeContent,
		themeControls,
	} = useThemeScheme(props)

	const [contentOffsetTop, setContentOffsetTop] = useState<number | undefined>(undefined)
	const contentRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		if (!contentRef.current) {
			return
		}

		const ref = contentRef.current

		const topOffsetHandler = () => {
			const contentOffsetTop = ref.offsetTop

			setContentOffsetTop(contentOffsetTop)
		}

		topOffsetHandler()

		window.addEventListener('resize', topOffsetHandler, { passive: true })

		return () => {
			window.removeEventListener('resize', topOffsetHandler)
		}
	}, [])

	const [showDivider, setShowDivider] = useState<boolean>(false)

	useEffect(() => {
		if (!document?.body?.parentElement) {
			return
		}

		const container = document.body.parentElement

		const scrollHandler = () => {
			const visibleWidth = container.offsetWidth
			const contentWidth = container.scrollWidth
			const scrollLeft = container.scrollLeft

			setShowDivider(contentWidth > visibleWidth && scrollLeft + visibleWidth < contentWidth)
		}

		scrollHandler()

		window.addEventListener('scroll', scrollHandler, { passive: true })

		return () => {
			window.removeEventListener('scroll', scrollHandler)
		}
	}, [])

	return <div className={classNames(
		`${prefix}layout-page`,
		toThemeClass(themeContent ?? theme, 'content'),
		toThemeClass(themeControls ?? theme, 'controls'),
		toEnumClass('scheme-', scheme),
	)}>
		{(title || actions) && <TitleBar after={<SectionTabs />} navigation={navigation} actions={actions} headingProps={headingProps}>
			{title}
		</TitleBar>}
		<div
			ref={contentRef}
			className={classNames(
				`${prefix}layout-page-content-wrap`,
				showDivider ? 'view-aside-divider' : undefined,
			)}
			style={{ '--cui-content-offset-top': `${contentOffsetTop}px` } as CSSProperties}
		>
			<PageLayoutContent>
				{children}
			</PageLayoutContent>
			{side && <Aside>{side}</Aside>}
		</div>
	</div>
})

LayoutPage.displayName = 'LayoutPage'
