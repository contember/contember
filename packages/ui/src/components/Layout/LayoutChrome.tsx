import { useClassNameFactory } from '@contember/utilities'
import { CSSProperties, ReactNode, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NavigationContext } from '../..'
import { Intent, Scheme } from '../../types'
import { toSchemeClass, toStateClass, toThemeClass, toViewClass } from '../../utils'
import { DropdownContentContainerProvider } from '../Dropdown/Dropdown'
import { Button } from '../Forms'
import { Icon } from '../Icon'
import { useElementTopOffset } from '../Layout/useElementTopOffset'
import { PreventCloseContext } from '../PreventCloseContext'
import { Stack } from '../Stack'
import { ThemeSchemeContext, TitleThemeSchemeContext } from './ThemeSchemeContext'
import { ThemeScheme } from './Types'
export interface LayoutChromeProps extends ThemeScheme {
	children?: ReactNode
	navigation?: ReactNode
	pageScheme?: Scheme
	pageTheme?: Intent
	pageThemeContent?: Intent
	pageThemeControls?: Intent
	sidebarFooter?: ReactNode
	sidebarHeader?: ReactNode
	switchers?: ReactNode
	titleScheme?: Scheme
	titleTheme?: Intent
	titleThemeContent?: Intent
	titleThemeControls?: Intent
}

const PREVENT_HAPPENED_RECENTLY = 100

/**
 * @group Layout UI
 */
export const LayoutChrome = memo(({
	children,
	navigation,
	pageScheme,
	pageTheme,
	pageThemeContent,
	pageThemeControls,
	scheme = 'light',
	sidebarFooter,
	sidebarHeader,
	switchers,
	theme,
	themeContent,
	themeControls,
	titleScheme,
	titleTheme,
	titleThemeContent,
	titleThemeControls,
}: LayoutChromeProps) => {
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
	const barContentOffsetTop = useElementTopOffset(contentRef)

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
		pageScheme,
		pageTheme,
		pageThemeContent,
		pageThemeControls,
		scheme,
		theme,
		themeContent,
		themeControls,
	])

	const titleThemeScheme = useMemo<ThemeScheme>(() => ({
		scheme: titleScheme ?? pageScheme ?? scheme,
		theme: titleTheme ?? pageTheme ?? theme,
		themeContent: titleThemeContent ?? pageThemeContent ?? themeContent,
		themeControls: titleThemeControls ?? pageThemeControls ?? themeControls,
	}), [
		pageScheme,
		pageTheme,
		pageThemeContent,
		pageThemeControls,
		scheme,
		theme,
		themeContent,
		themeControls,
		titleScheme,
		titleTheme,
		titleThemeContent,
		titleThemeControls,
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

	const componentClassName = useClassNameFactory('layout-chrome')
	const componentBarClassName = useClassNameFactory('layout-chrome-bar')
	const hasBar: boolean = !!(sidebarHeader || switchers || navigation || sidebarFooter)

	return (
		<div
			ref={layoutRef}
			className={componentClassName(null, [
				toViewClass('no-bar', !hasBar),
				toThemeClass(themeContent ?? theme, themeControls ?? theme),
				toSchemeClass(scheme),
				toViewClass('collapsed', collapsed),
			])}
			style={useMemo(() => (barContentOffsetTop
				? ({ '--cui-bar-content-offset-top': `${barContentOffsetTop}px` } as CSSProperties)
				: undefined
			), [barContentOffsetTop])}
		>
			{hasBar && (
				<DropdownContentContainerProvider>
					<PreventCloseContext.Provider value={preventMenuClose}>
						<div className={componentBarClassName()}>
							<div className={componentBarClassName('header')}>
								{sidebarHeader && <div className={componentBarClassName('header-inner')}>{sidebarHeader}</div>}
								<Button id="cui-menu-button" distinction="seamless" className={componentClassName('navigation-button')} onClick={toggleCollapsed}>
									<span className={componentClassName('menu-button-label')}>Menu</span>
									<Icon blueprintIcon={collapsed ? 'menu' : 'cross'} />
								</Button>
							</div>
							{switchers && <div className={componentBarClassName('switchers')}>{switchers}</div>}
							{navigation && <div ref={contentRef} className={componentBarClassName('body')}>
								<span className={componentBarClassName('body-scrolled-indicator', [
									toStateClass('scrolled', isScrolled),
								])} />
								<Stack direction="vertical">
									{navigation}
								</Stack>
							</div>}
							{sidebarFooter && <div className={componentBarClassName('footer')}>
								{sidebarFooter}
							</div>}
						</div>
					</PreventCloseContext.Provider>
				</DropdownContentContainerProvider>
			)}

			<DropdownContentContainerProvider>
				<div className={componentClassName('body', [
					toSchemeClass(pageScheme ?? scheme),
					toThemeClass(pageThemeContent ?? pageTheme, pageThemeControls ?? pageTheme),
				])}>
					<ThemeSchemeContext.Provider value={themeScheme}>
						<TitleThemeSchemeContext.Provider value={titleThemeScheme}>
							{children}
						</TitleThemeSchemeContext.Provider>
					</ThemeSchemeContext.Provider>
				</div>
			</DropdownContentContainerProvider>
			<div id="portal-root" />
		</div>
	)
})

LayoutChrome.displayName = 'LayoutChrome'
