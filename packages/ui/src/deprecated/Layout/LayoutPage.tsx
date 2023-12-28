import { ColorSchemeContext, useClassNameFactory, useColorScheme, useElementTopOffset } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName, px } from '@contember/utilities'
import { ReactNode, memo, useEffect, useRef, useState } from 'react'
import { SectionTabs, useSectionTabs } from '../../components/SectionTabs'
import { toEnumClass } from '../../utils'
import { TitleBar, TitleBarProps } from '../TitleBar'
import { LayoutPageAside } from './LayoutPageAside'
import { LayoutPageContent, LayoutPageContentProps } from './LayoutPageContent'
import { useThemeScheme } from './ThemeSchemeContext'
import { ThemeScheme } from './Types'
export interface LayoutPageProps extends Omit<TitleBarProps, 'after' | 'children'>, ThemeScheme {
	afterTitle?: TitleBarProps['after']
	children?: ReactNode
	fit?: 'content' | 'none'
	pageContentLayout?: LayoutPageContentProps['pageContentLayout']
	side?: ReactNode
	title?: ReactNode
}

/**
 * @deprecated Use `LayoutKit` from `@contember/layout` instead.
 * @group Layout UI
 */
export const LayoutPage = memo(({
	actions,
	afterTitle,
	children,
	fit = 'content',
	navigation,
	pageContentLayout,
	side,
	title,
	...props
}: LayoutPageProps) => {
	const componentClassName = useClassNameFactory('layout-page')
	const {
		scheme,
		theme,
		themeContent,
		themeControls,
	} = useThemeScheme(props)

	const contentRef = useRef<HTMLDivElement>(null)
	const contentOffsetTop = useElementTopOffset(contentRef)
	const hasTabs = Object.keys(useSectionTabs()).length > 0

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

	const colorScheme = useColorScheme()

	return (
		<ColorSchemeContext.Provider value={scheme ?? colorScheme}>
			<div className={componentClassName(null, [
				contentThemeClassName(themeContent ?? theme),
				controlsThemeClassName(themeControls ?? theme),
				colorSchemeClassName(scheme),
			])}>
				<style>{`.cui-layout-chrome { --cui-content-offset-top: ${px(contentOffsetTop)};}`}</style>
				{(title || actions) && <TitleBar after={afterTitle === undefined ? hasTabs ? <SectionTabs /> : undefined : afterTitle} navigation={navigation} actions={actions}>
					{title}
				</TitleBar>}
				<div
					ref={contentRef}
					className={componentClassName('content-wrap', [
						toEnumClass('fit-', fit),
						showDivider ? 'view-aside-divider' : undefined,
					])}
				>
					<LayoutPageContent pageContentLayout={pageContentLayout}>
						{children}
					</LayoutPageContent>
					{side && <LayoutPageAside>{side}</LayoutPageAside>}
				</div>
			</div>
		</ColorSchemeContext.Provider>
	)
})

LayoutPage.displayName = 'LayoutPage'
