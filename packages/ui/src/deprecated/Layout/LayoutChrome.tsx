import { ColorSchemeProvider, ContainerWidthContext, useClassNameFactory, useElementSize } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName } from '@contember/utilities'
import { MenuIcon, XIcon } from 'lucide-react'
import { ReactNode, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NavigationContext } from '../../Navigation'
import { DialogProvider, Divider, Spacer } from '../../components'
import { Button } from '../../components/Forms'
import { PortalProvider } from '../../components/Portal'
import { PreventCloseContext } from '../../components/PreventCloseContext'
import { Stack } from '../../components/Stack'
import { Intent, Scheme } from '../../types'
import { toViewClass } from '../../utils'
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
 * @deprecated Use `LayoutKit` from `@contember/layout` instead.
 * @group Layout UI
 */
export const LayoutChrome = memo(({
	children,
	navigation,
	pageScheme,
	pageTheme,
	pageThemeContent,
	pageThemeControls,
	scheme,
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
	const [isScrolledTop, setIsScrolledTop] = useState(false)
	const [isScrolledBottom, setIsScrolledBottom] = useState(false)
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
			const scrollBottom = Math.floor(contentRefCopy?.scrollHeight ?? 0) - Math.floor(contentRefCopy?.clientHeight ?? 0) - scrollTop

			setIsScrolledTop(scrollTop > 1)
			setIsScrolledBottom(scrollBottom > 1)
		}

		contentRefCopy?.addEventListener('scroll', listener)

		return () => {
			contentRefCopy?.removeEventListener('scroll', listener)
		}
	}, [contentRef, isScrolledTop])

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

	const barElementRef = useRef<HTMLDivElement>(null)
	const barElementSize = useElementSize(barElementRef)
	const componentBarClassName = useClassNameFactory('layout-chrome-bar')
	const hasBar: boolean = !!(sidebarHeader || switchers || navigation || sidebarFooter)

	return (
		<ColorSchemeProvider scheme={scheme}>
			<div
				ref={layoutRef}
				className={componentClassName(null, [
					toViewClass('no-bar', !hasBar),
					contentThemeClassName(themeContent ?? theme),
					controlsThemeClassName(themeControls ?? theme),
					colorSchemeClassName(scheme), ,
					toViewClass('collapsed', collapsed),
				])}
			>
				{hasBar && (
					<PortalProvider>
						<DialogProvider>
							<PreventCloseContext.Provider value={preventMenuClose}>
								<div ref={barElementRef} className={componentBarClassName()}>
									<ContainerWidthContext.Provider value={barElementSize.width}>
										<div className={componentBarClassName('header')}>
											<div className={componentBarClassName('header-inner')}>
												{sidebarHeader}
												<Spacer grow />
												<Button id="cui-menu-button" distinction="seamless" className={componentClassName('navigation-button')} onClick={toggleCollapsed}>
													<span className={componentClassName('menu-button-label')}>Menu</span>
													{collapsed ? <MenuIcon /> : <XIcon />}
												</Button>
											</div>
										</div>
										{switchers && (
											<>
												<Divider gap={false} />
												<div className={componentBarClassName('switchers')}>{switchers}</div>
											</>
										)}
										<Divider gap={false} style={isScrolledTop ? undefined : zeroOpacityStyle} />
										<div ref={contentRef} className={componentBarClassName('body')}>
											{navigation && <Stack>{navigation}</Stack>}
										</div>
										{sidebarFooter && (
											<>
												<Divider gap={false} style={isScrolledBottom ? undefined : zeroOpacityStyle} />
												<div className={componentBarClassName('footer')}>
													{sidebarFooter}
												</div>
											</>
										)}
									</ContainerWidthContext.Provider>
								</div>
							</PreventCloseContext.Provider>
						</DialogProvider>
					</PortalProvider>
				)}

				<PortalProvider>
					<DialogProvider>
						<div className={componentClassName('body', [
							contentThemeClassName(pageThemeContent ?? pageTheme),
							controlsThemeClassName(pageThemeControls ?? pageTheme),
							colorSchemeClassName(pageScheme ?? scheme),
						])}>
							<ThemeSchemeContext.Provider value={themeScheme}>
								<TitleThemeSchemeContext.Provider value={titleThemeScheme}>
									{children}
								</TitleThemeSchemeContext.Provider>
							</ThemeSchemeContext.Provider>
						</div>
					</DialogProvider>
				</PortalProvider>
			</div>
		</ColorSchemeProvider>
	)
})

LayoutChrome.displayName = 'LayoutChrome'

const zeroOpacityStyle = { opacity: 0 }
