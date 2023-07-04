import { Button, DevPanel, DimensionsSwitcher, Link, LogoutLink, Scheme, Spacer, Stack, VisuallyHidden, toSchemeClass, toThemeClass } from '@contember/admin'
import { Identity2023 } from '@contember/brand'
import { SafeAreaInsetsProvider } from '@contember/layout'
import { useContainerWidth, useDocumentTitle, useReferentiallyStableCallback, useSessionStorageState } from '@contember/react-utils'
import { Intent, Radio } from '@contember/ui'
import { CircleDashedIcon, LayoutIcon, LogOutIcon, MoonIcon, PaintBucketIcon, SmartphoneIcon, SunIcon } from 'lucide-react'
import { PropsWithChildren, memo, useMemo, useRef, useState } from 'react'
import { AlertLogoutLink } from './AlertLogoutLink'
import { LAYOUT_BREAKPOINT } from './Constants'
import { Directive, DirectivesType, initialDirectives, useDirectives } from './Directives'
import { LayoutType, Layouts } from './Layouts'
import { Navigation } from './Navigation'
import { SlotSources } from './Slots'

export const Layout = memo(({ children }: PropsWithChildren) => {
	const directives = useDirectives()
	useDocumentTitle(directives.title)

	const LayoutComponent = Layouts[directives?.layout ?? 'default'] ?? Layouts.default
	const width = useContainerWidth()

	const [scheme, setScheme] = useSessionStorageState<Scheme>(
		'contember-admin-sandbox-scheme',
		scheme => scheme ?? 'system',
	)

	const safeAreaInsets = directives['safe-area-insets'] ?? 0

	return (
		<SafeAreaInsetsProvider insets={useMemo(() => ({ top: safeAreaInsets, right: safeAreaInsets, left: safeAreaInsets, bottom: safeAreaInsets }), [safeAreaInsets])}>
			<LayoutComponent
				className={[
					toThemeClass(directives['layout.theme-content'], directives['layout.theme-controls']),
					toSchemeClass(scheme),
				]}
			>
				<SlotSources.Logo>
					<Link to="index">
						<Stack align="center" direction="horizontal" gap="small">
							<Identity2023.Edit scale={2} />
							<VisuallyHidden hidden={width < LAYOUT_BREAKPOINT}>Contember</VisuallyHidden>
						</Stack>
					</Link>
				</SlotSources.Logo>

				<SlotSources.Switchers>
					<Button
						size="small"
						elevation="none"
						distinction="seamless"
						active={!scheme.match(/system/)}
						flow="circular"
						onClick={useReferentiallyStableCallback(() => {
							setScheme(scheme => (scheme.match(/light/) ? 'dark' : scheme.match(/dark/) ? 'system' : 'light'))
						})}
						aria-label={scheme.match(/light/) ? 'Light mode, switch to dark mode' : scheme.match(/dark/) ? 'Dark mode, switch to light mode' : 'System mode, switch to system mode'}
					>
						{scheme.match(/light/) ? <SunIcon /> : scheme.match(/dark/) ? <MoonIcon /> : <CircleDashedIcon />}
					</Button>

					<DimensionsSwitcher
						optionEntities="Locale"
						orderBy="code asc"
						dimension="locale"
						labelField="code"
						slugField="code"
						maxItems={1}
					/>
				</SlotSources.Switchers>

				{Navigation && (
					<SlotSources.Navigation>
						<Navigation />
					</SlotSources.Navigation>
				)}

				<SlotSources.Profile>
					<LogoutLink Component={AlertLogoutLink}>
						<Stack align="center" direction="horizontal" gap="small">
							<LogOutIcon /> Logout
						</Stack>
					</LogoutLink>
				</SlotSources.Profile>

				{children}
			</LayoutComponent>
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
					{Object.keys(Layouts).map(key => (
						<Button active={typeState === key} flow="block" key={key} onClick={() => {
							setTypeState(previous => previous === key ? undefined : key as unknown as LayoutType)
						}}>{key}</Button>
					))}

					<Spacer />

					<Button flow="block" distinction="seamless" onClick={() => {
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
				<Stack direction="horizontal" gap="large">
					<Stack direction="vertical" gap="default">
						<h3>Content</h3>
						<Radio
							value={contentTheme ?? ''}
							options={[
								{ label: 'None', value: '' },
								{ label: 'Default', value: 'default' },
								{ label: 'Primary', value: 'primary' },
								{ label: 'Secondary', value: 'secondary' },
								{ label: 'Tertiary', value: 'tertiary' },
								{ label: 'Positive', value: 'positive' },
								{ label: 'Success', value: 'success' },
								{ label: 'Warning', value: 'warn' },
								{ label: 'Danger', value: 'danger' },
							] satisfies { label: string; value: Intent | '' }[]}
							onChange={value => value ? setContentTheme(value as Intent) : setContentTheme(undefined)}
						/>
					</Stack>

					<Stack direction="vertical" gap="default">
						<h3>Controls</h3>
						<Radio
							value={controlsTheme ?? ''}
							options={[
								{ label: 'None', value: '' },
								{ label: 'Default', value: 'default' },
								{ label: 'Primary', value: 'primary' },
								{ label: 'Secondary', value: 'secondary' },
								{ label: 'Tertiary', value: 'tertiary' },
								{ label: 'Positive', value: 'positive' },
								{ label: 'Success', value: 'success' },
								{ label: 'Warning', value: 'warn' },
								{ label: 'Danger', value: 'danger' },
							] satisfies { label: string; value: Intent | '' }[]}
							onChange={value => value ? setControlsTheme(value as Intent) : setControlsTheme(undefined)}
						/>
					</Stack>
				</Stack>
			</DevPanel>
		</>
	)
}
