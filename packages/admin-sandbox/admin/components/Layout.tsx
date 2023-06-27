import { Button, DevPanel, Link, LogoutLink, Stack, VisuallyHidden } from '@contember/admin'
import { Identity2023 } from '@contember/brand'
import { useDocumentTitle, useLayoutContainerWidth } from '@contember/react-utils'
import { Intent, Radio, Spacer } from '@contember/ui'
import { LayoutIcon, LogOutIcon, PaintBucketIcon } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'
import { AlertLogoutLink } from './AlertLogoutLink'
import { LAYOUT_BREAKPOINT } from './Constants'
import { Directive, DirectivesType, useDirectives } from './Directives'
import { LayoutType, Layouts } from './Layouts'
import { Navigation } from './Navigation'
import { Slots } from './Slots'

export const Layout = (props: PropsWithChildren) => {
	const directives = useDirectives()
	useDocumentTitle(directives.title)

	const LayoutComponent = Layouts[directives.layout] ?? Layouts.default
	const width = useLayoutContainerWidth()

	return (
		<>
			<Slots.Title>
				<h1>{directives.title}</h1>
			</Slots.Title>

			<Slots.Logo>
				<Link to="index">
					<Stack align="center" direction="horizontal" gap="small">
						<Identity2023.Edit scale={2} />
						<VisuallyHidden hidden={width < LAYOUT_BREAKPOINT}>Contember</VisuallyHidden>
					</Stack>
				</Link>
			</Slots.Logo>

			<Slots.Navigation>
				<Navigation />
			</Slots.Navigation>

			<Slots.Profile>
				<LogoutLink Component={AlertLogoutLink}>
					<Stack align="center" direction="horizontal" gap="small">
						<LogOutIcon /> Logout
					</Stack>
				</LogoutLink>
			</Slots.Profile>

			<LayoutComponent />

			{props.children}
		</>
	)
}

export const LayoutDevPanel = () => {
	const [typeState, setTypeState] = useState<LayoutType>()
	const { layout } = useDirectives()
/*
	const registered = Directives.useDirectiveLifecycle('layout', typeState)

	return !registered
		? null
		: (
*/
	return (
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
