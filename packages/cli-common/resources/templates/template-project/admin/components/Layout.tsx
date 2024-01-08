import { Button, Link, LogoutLink, PortalProvider, Scheme, Stack, VisuallyHidden } from '@contember/admin'
import { SafeAreaInsetsProvider } from '@contember/layout'
import { ColorSchemeProvider, useContainerWidth, useReferentiallyStableCallback, useSessionStorageState } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName } from '@contember/utilities'
import { CircleDashedIcon, LogOutIcon, MoonIcon, SunIcon } from 'lucide-react'
import { PropsWithChildren, memo } from 'react'
import { LAYOUT_BREAKPOINT } from './Constants'
import { useDirectives } from './Directives'
import { LayoutComponent } from './LayoutComponent'
import { SlotSources } from './Slots'
import { Navigation } from './Navigation'

export const Layout = memo(({ children }: PropsWithChildren) => {
	const directives = useDirectives()
	const width = useContainerWidth()

	const [scheme, setScheme] = useSessionStorageState<Scheme>(
		'contember-admin-sandbox-scheme',
		scheme => scheme ?? 'system',
	)

	const colorSchemeTheme = [
		colorSchemeClassName(scheme),
		contentThemeClassName(directives['layout.theme-content']),
		controlsThemeClassName(directives['layout.theme-controls']),
	].join(' ')

	return (
		<SafeAreaInsetsProvider>
			<ColorSchemeProvider scheme={scheme}>
				<PortalProvider className={colorSchemeTheme}>
					<LayoutComponent className={colorSchemeTheme}>
						<SlotSources.Logo>
							<Link to="index">
								<Stack align="center" horizontal gap="small">
									<VisuallyHidden className="whitespace-nowrap" hidden={width < LAYOUT_BREAKPOINT}>{'{projectName}'}</VisuallyHidden>
								</Stack>
							</Link>
						</SlotSources.Logo>
						<SlotSources.Navigation>
							<Navigation />
						</SlotSources.Navigation>

						<SlotSources.Switchers>
							<Button
								square
								active={!scheme.match(/system/)}
								aria-label={scheme.match(/light/) ? 'Light mode, switch to dark mode' : scheme.match(/dark/) ? 'Dark mode, switch to light mode' : 'System mode, switch to system mode'}
								borderRadius="full"
								distinction="seamless"
								onClick={useReferentiallyStableCallback(() => {
									setScheme(scheme => (scheme.match(/light/) ? 'dark' : scheme.match(/dark/) ? 'system' : 'light'))
								})}
								size="small"
							>
								{scheme.match(/light/) ? <SunIcon /> : scheme.match(/dark/) ? <MoonIcon /> : <CircleDashedIcon />}
							</Button>
						</SlotSources.Switchers>

						<SlotSources.Profile>
							<LogoutLink>
								<Stack align="center" horizontal gap="small">
									<LogOutIcon /> Logout
								</Stack>
							</LogoutLink>
						</SlotSources.Profile>

						{children}
					</LayoutComponent>
				</PortalProvider>
			</ColorSchemeProvider>
		</SafeAreaInsetsProvider>
	)
})
Layout.displayName = 'Layout'
