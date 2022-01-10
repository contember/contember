import classNames from 'classnames'
import { memo, ReactNode, useLayoutEffect, useRef } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toEnumClass, toThemeClass } from '../../utils'
import { SectionTabs, useSectionTabsRegistration } from '../SectionTabs'
import { Stack } from '../Stack'
import { TitleBar, TitleBarProps } from '../TitleBar'
import { useThemeScheme } from './ThemeSchemeContext'
import { ThemeScheme } from './Types'

export const PageLayoutContent = ({ children }: { children: ReactNode }) => {
	const prefix = useClassNamePrefix()

	return <div className={`${prefix}layout-page-content`}>
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
	actions,
	children,
	headingProps,
	navigation,
	scheme: schemeProp,
	theme: themeProp,
	themeContent: themeContentProp,
	themeControls: themeControlsProp,
	side,
	title,
}: LayoutPageProps) => {
	const prefix = useClassNamePrefix()
	const {
		scheme: schemeContext,
		theme: themeContext,
		themeContent: themeContentContext,
		themeControls: themeControlsContext,
	} = useThemeScheme()

	const scheme = schemeProp ?? schemeContext
	const theme = themeProp ?? themeContext
	const themeContent = themeContentProp ?? themeContentContext
	const themeControls = themeControlsProp ?? themeControlsContext

	return <div className={classNames(
		`${prefix}layout-page`,
		toThemeClass(themeContent ?? theme, 'content'),
		toThemeClass(themeControls ?? theme, 'controls'),
		toEnumClass('scheme-', scheme),
	)}>
		{(title || actions) && <TitleBar after={<SectionTabs />} navigation={navigation} actions={actions} headingProps={headingProps}>
			{title}
		</TitleBar>}
		<div className={`${prefix}layout-page-content-wrap`}>
			<PageLayoutContent>
				{children}
			</PageLayoutContent>
			{side && <Aside>{side}</Aside>}
		</div>
	</div>
})

LayoutPage.displayName = 'LayoutPage'
