import { default as classNames, default as classnames } from 'classnames'
import { memo, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NavigationContext } from '../..'
import { useClassNamePrefix } from '../../auxiliary'
import { Intent, Scheme } from '../../types'
import { toEnumClass, toStateClass, toThemeClass, toViewClass } from '../../utils'
import { DropdownContentContainerProvider } from '../Dropdown'
import { Button } from '../Forms'
import { Icon } from '../Icon'
import { PreventCloseContext } from '../PreventCloseContext'
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

const PREVENT_HAPPENED_RECENTLY = 100

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
	const navigationContext = useContext(NavigationContext)
	const preventedAt = useRef<Date | null>(null)

	useEffect(() => {
		const wasPrevented = preventedAt.current
			? (new Date()).valueOf() - preventedAt.current.valueOf() <= PREVENT_HAPPENED_RECENTLY
			: false

		if (!wasPrevented) {
			setCollapsed(true)
		}
	}, [navigationContext])

	const preventMenuClose = useCallback(() => {
		preventedAt.current = new Date()
	}, [])

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

	const layoutRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!layoutRef.current) {
			return
		}

		const layout = layoutRef.current

		const keyboardListener = (event: KeyboardEvent) => {
			if (event.code === 'Escape' && !collapsed) {
				document.getElementById('cui-menu-button')?.focus()
				setCollapsed(true)
			}
		}

		layout.addEventListener('keyup', keyboardListener)

		return () => {
			layout.removeEventListener('keyup', keyboardListener)
		}
	})

	return <div ref={layoutRef} className={classnames(
		`${prefix}layout-chrome`,
		toThemeClass(themeContent ?? theme, 'content'),
		toThemeClass(themeControls ?? theme, 'controls'),
    toEnumClass('scheme-', scheme),
		toViewClass('collapsed', collapsed),
	)}>
		<DropdownContentContainerProvider>
			<PreventCloseContext.Provider value={preventMenuClose}>
				<div className={`${prefix}layout-chrome-bar`}>
					<div className={`${prefix}layout-chrome-bar-header`}>
						{sidebarHeader && <div className={`${prefix}layout-chrome-bar-header-inner`}>{sidebarHeader}</div>}
						<Button id="cui-menu-button" distinction="seamless" className={`${prefix}layout-chrome-navigation-button`} onClick={toggleCollapsed}>
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
			</PreventCloseContext.Provider>
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
