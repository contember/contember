import { default as classNames, default as classnames } from 'classnames'
import { memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { Intent, Scheme } from '../../types'
import { toEnumClass, toStateClass, toThemeClass, toViewClass } from '../../utils'
import { DropdownContentContainerProvider } from '../Dropdown'
import { Button } from '../Forms'
import { Icon } from '../Icon'
import { Stack } from '../Stack'
import { ThemeSchemeContext } from './ThemeSchemeContext'
import { ThemeScheme } from './Types'
export interface LayoutChromeProps extends ThemeScheme {
	children?: ReactNode
	sidebarFooter?: ReactNode
	sidebarHeader?: ReactNode
	navigation?: ReactNode
	switchers?: ReactNode
	pageScheme?: Scheme
	pageTheme?: Intent
	pageThemeContent?: Intent
	pageThemeControls?: Intent
}

export const LayoutChrome = memo(({
	children,
	sidebarFooter,
	sidebarHeader,
	navigation,
	switchers,
	scheme,
	theme,
	themeContent,
	themeControls,
	pageScheme,
	pageTheme,
	pageThemeContent,
	pageThemeControls,
}: LayoutChromeProps) => {
	const prefix = useClassNamePrefix()

	const [collapsed, setCollapsed] = useState(true)
	const [isScrolled, setIsScrolled] = useState(false)

	const toggleCollapsed = useCallback(() => {
		setCollapsed(!collapsed)
	}, [collapsed, setCollapsed])

	const contentRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const contentRefCopy = contentRef.current
		const listener = () => {
			const scrollTop = Math.floor(contentRefCopy?.scrollTop ?? 0)
			const nextIsScrolled = scrollTop > 1

			if (isScrolled !== nextIsScrolled) {
				setIsScrolled(nextIsScrolled)
			}
		}

		contentRefCopy?.addEventListener('scroll', listener)

		return () => {
			contentRefCopy?.removeEventListener('scroll', listener)
		}
	}, [contentRef, isScrolled])

	const themeScheme = useMemo<ThemeScheme>(() => ({
		scheme: pageScheme ?? scheme,
		theme: pageTheme ?? theme,
		themeContent: pageThemeContent ?? themeContent,
		themeControls: pageThemeControls ?? themeControls,
	}), [
		scheme,
		theme,
		themeContent,
		themeControls,
		pageScheme,
		pageTheme,
		pageThemeContent,
		pageThemeControls,
	])

	return <div className={classnames(
		`${prefix}layout-chrome`,
		toThemeClass(themeContent ?? theme, 'content'),
		toThemeClass(themeControls ?? theme, 'controls'),
    toEnumClass('scheme-', scheme),
		toViewClass('collapsed', collapsed),
	)}>
		<DropdownContentContainerProvider>
			<div className={`${prefix}layout-chrome-bar`}>
				<div className={`${prefix}layout-chrome-bar-header`}>
					{sidebarHeader}
					<Button distinction="seamless" className={`${prefix}layout-chrome-navigation-button`} onClick={toggleCollapsed}>
						<span className={`${prefix}chrome-menu-button-label`}>Menu</span>
						<Icon blueprintIcon={collapsed ? 'menu' : 'cross'} />
					</Button>
				</div>
				{switchers && <div className={`${prefix}layout-chrome-bar-switchers`}>{switchers}</div>}
				<div ref={contentRef} className={classNames(
					`${prefix}layout-chrome-bar-body`,
					toStateClass('scrolled', isScrolled),
				)}>
					<Stack direction="vertical">
						{navigation}
					</Stack>
				</div>
				<div className={`${prefix}layout-chrome-bar-footer`}>
					{sidebarFooter}
				</div>
			</div>
		</DropdownContentContainerProvider>

		<DropdownContentContainerProvider>
			<div className={classNames(
				`${prefix}layout-chrome-body`,
				toEnumClass('scheme-', pageScheme ?? scheme),
				toThemeClass(pageThemeContent ?? pageTheme, 'content'),
			)}>
				<ThemeSchemeContext.Provider value={themeScheme}>
					{children}
				</ThemeSchemeContext.Provider>
			</div>
		</DropdownContentContainerProvider>
		<div id="portal-root" />
	</div>
})

LayoutChrome.displayName = 'LayoutChrome'
