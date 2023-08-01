import { Button, DevPanel, DimensionsSwitcher, Intent, Link, LogoutLink, PortalProvider, Radio, Scheme, Spacer, Stack, VisuallyHidden } from '@contember/admin'
import { Identity2023 } from '@contember/brand'
import { SafeAreaInsetsProvider } from '@contember/layout'
import { ColorSchemeProvider, useContainerWidth, useReferentiallyStableCallback, useSessionStorageState } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName, listClassName } from '@contember/utilities'
import { CircleDashedIcon, LayoutIcon, LogOutIcon, MoonIcon, PaintBucketIcon, SmartphoneIcon, SunIcon } from 'lucide-react'
import { PropsWithChildren, memo, useMemo, useRef, useState } from 'react'
import { AlertLogoutLink } from './AlertLogoutLink'
import { LAYOUT_BREAKPOINT } from './Constants'
import { Directive, DirectivesType, initialDirectives, useDirectives } from './Directives'
import { LayoutComponents, LayoutType } from './LayoutComponent'
import { Navigation } from './Navigation'
import { SlotSources } from './Slots'

export const Layout = memo(({ children }: PropsWithChildren) => {
	const directives = useDirectives()

	const LayoutComponent = LayoutComponents[directives?.layout ?? 'default'] ?? LayoutComponents.default
	const width = useContainerWidth()

	const [scheme, setScheme] = useSessionStorageState<Scheme>(
		'contember-admin-sandbox-scheme',
		scheme => scheme ?? 'system',
	)

	const safeAreaInsets = directives['safe-area-insets'] ?? 0

	const colorSchemeTheme = listClassName([
		colorSchemeClassName(scheme),
		contentThemeClassName(directives['layout.theme-content']),
		controlsThemeClassName(directives['layout.theme-controls']),
	])

	return (
		<SafeAreaInsetsProvider insets={useMemo(() => ({ top: safeAreaInsets, right: safeAreaInsets, left: safeAreaInsets, bottom: safeAreaInsets }), [safeAreaInsets])}>
			<ColorSchemeProvider scheme={scheme}>
				<PortalProvider className={colorSchemeTheme}>
					<LayoutComponent className={colorSchemeTheme}>
						<SlotSources.Logo>
							<Link to="index">
								<Stack align="center" horizontal gap="gap">
									<Identity2023.Edit scale={2} />
									<VisuallyHidden className="whitespace-nowrap" hidden={width < LAYOUT_BREAKPOINT}>Contember Sandbox</VisuallyHidden>
								</Stack>
							</Link>
						</SlotSources.Logo>

						<SlotSources.Switchers>
							<DimensionsSwitcher
								optionEntities="Locale"
								orderBy="code asc"
								dimension="locale"
								labelField="code"
								slugField="code"
								maxItems={1}
							/>

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

						{Navigation && (
							<SlotSources.Navigation>
								<Navigation />
							</SlotSources.Navigation>
						)}

						<SlotSources.Profile>
							<LogoutLink Component={AlertLogoutLink}>
								<Stack align="center" horizontal gap="gap">
									<LogOutIcon /> Logout
								</Stack>
							</LogoutLink>
						</SlotSources.Profile>

						<SlotSources.FooterCenter>
							<p><small>Created with <a className="content-link" href="https://www.contember.com/">AI-assisted Contember Studio</a></small></p>
						</SlotSources.FooterCenter>

						{children}
					</LayoutComponent>
				</PortalProvider>
			</ColorSchemeProvider>
		</SafeAreaInsetsProvider>
	)
})
Layout.displayName = 'Layout'

export const LayoutDevPanel = () => {
	const [typeState, setTypeState] = useState<LayoutType>()
	const { layout } = useDirectives()

	return layout
		? (
			<>
				<Directive key={typeState ?? '(unset)'} name="layout" content={typeState} />
				<DevPanel icon={<LayoutIcon />} heading={`Layout: ${layout}`}>
					{Object.keys(LayoutComponents).map(key => (
						<Button active={typeState === key} display="block" key={key} onClick={() => {
							setTypeState(previous => previous === key ? undefined : key as unknown as LayoutType)
						}}>{key}</Button>
					))}

					<Spacer />

					<Button padding={false} display="block" distinction="seamless" onClick={() => {
						setTypeState(undefined)
					}}>Reset</Button>
				</DevPanel>
			</>
		)
		: null
}
Layout.displayName = 'SandBox.Layout'

const MAX_INSET = 90
const MIN_INSET = 0

export const SafeAreasDevPanel = () => {
	const [inset, setInset] = useState<number>(initialDirectives['safe-area-insets'] ?? 0)
	const shiftPressed = useRef(false)

	const handleSetInset = useReferentiallyStableCallback((inset: number) => {
		setInset(Math.max(MIN_INSET, Math.min(MAX_INSET, inset)))
	})

	const handleKeyUp = useReferentiallyStableCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Shift') {
			shiftPressed.current = false
		}

		if (shiftPressed.current) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault()
				event.stopPropagation()

				const direction = event.key === 'ArrowDown' ? -1 : 1

				handleSetInset(inset + 10 * direction)
			}
		}

	})

	const handleKeyDown = useReferentiallyStableCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Shift') {
			shiftPressed.current = true
		}
	})

	const onChange = useReferentiallyStableCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		if (shiftPressed.current) {
			event.preventDefault()
			event.stopPropagation()
		} else {
			handleSetInset(parseInt(event.target.value))
		}
	})

	return (
		typeof inset === 'number'
			? (
				<>
					<Directive name="safe-area-insets" content={inset} />
					<DevPanel icon={<SmartphoneIcon />} heading="Safe Area Insets">
						<input type="number" className="cui-text-input cui-number-input" value={inset} onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} min={0} max={MAX_INSET} onChange={onChange} />
					</DevPanel>
				</>
			)
			: null
	)
}

export const ThemeDevPanel = () => {
	const [contentTheme, setContentTheme] = useState<Exclude<DirectivesType['layout.theme-content'], null>>(undefined)
	const [controlsTheme, setControlsTheme] = useState<Exclude<DirectivesType['layout.theme-controls'], null>>(undefined)

	return (
		<>
			<Directive name="layout.theme-content" content={contentTheme} />
			<Directive name="layout.theme-controls" content={controlsTheme} />

			<DevPanel icon={<PaintBucketIcon />} heading="Theme">
				<Stack horizontal gap="large">
					<Stack>
						<h3>Content</h3>
						<Radio
							value={contentTheme ?? ''}
							options={[
								{ label: 'None', value: '' },
								{ label: 'Accent', value: 'accent' },
								{ label: 'Primary', value: 'primary' },
								{ label: 'Secondary', value: 'secondary' },
								{ label: 'Tertiary', value: 'tertiary' },
								{ label: 'Positive', value: 'positive' },
								{ label: 'Success', value: 'success' },
								{ label: 'Warning', value: 'warn' },
								{ label: 'Danger', value: 'danger' },
								{ label: 'Default', value: 'default' },
							] satisfies { label: string; value: Intent | '' }[]}
							onChange={value => value ? setContentTheme(value as Intent) : setContentTheme(undefined)}
						/>
					</Stack>

					<Stack>
						<h3>Controls</h3>
						<Radio
							value={controlsTheme ?? ''}
							options={[
								{ label: 'None', value: '' },
								{ label: 'Accent', value: 'accent' },
								{ label: 'Primary', value: 'primary' },
								{ label: 'Secondary', value: 'secondary' },
								{ label: 'Tertiary', value: 'tertiary' },
								{ label: 'Positive', value: 'positive' },
								{ label: 'Success', value: 'success' },
								{ label: 'Warning', value: 'warn' },
								{ label: 'Danger', value: 'danger' },
								{ label: 'Default', value: 'default' },
							] satisfies { label: string; value: Intent | '' }[]}
							onChange={value => value ? setControlsTheme(value as Intent) : setControlsTheme(undefined)}
						/>
					</Stack>
				</Stack>
			</DevPanel>
		</>
	)
}
