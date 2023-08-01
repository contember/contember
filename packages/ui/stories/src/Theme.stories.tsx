import { listClassName } from '@contember/utilities'
import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Button, Stack } from '../../src'
import { Intent, Scheme } from '../../src/types'
import { enumControl } from './Helpers'

const colorThemes = [
	'default',
	'primary',
	'secondary',
	'tertiary',
	'positive',
	'success',
	'warn',
	'danger',
]

const backgrounds = ['inherit', 'system', 'light', 'dark']
const intents = [...colorThemes, undefined]
const buttonSchemes = ['system', 'light', 'dark', undefined]
const belowAbove = ['above', undefined, 'below']

interface ThemePreviewProps {
	background: typeof backgrounds[number],
	belowAbove: typeof belowAbove[number],
	intent: Intent | undefined,
	buttonScheme: Scheme,
	children: React.ReactNode,
}

const swatchSize = '3em'

const TextPreview = ({ children }: { children: string }) => <div style={{
	alignItems: 'center',
	color: `var(--${children})`,
	display: 'flex',
	height: swatchSize,
	justifyContent: 'center',
	minHeight: swatchSize,
	minWidth: swatchSize,
	verticalAlign: 'middle',
	width: swatchSize,
}}><em><strong>A</strong></em>a</div>

const PropertyText = ({ children }: { children: string }) => <Stack horizontal gap="gap" align="center">
	<TextPreview>{children}</TextPreview>
	<span style={{ fontSize: '0.8125em', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>
</Stack>

const PropertyBorderPreview = ({ children }: { children: string | string[] }) => (
	<div style={{
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'column',
		height: swatchSize,
		justifyContent: 'center',
		minHeight: swatchSize,
		width: swatchSize,
		minWidth: swatchSize,
	}}>
		<Stack gap="gap">
			<div style={{ borderTop: `1px solid var(--${children})`, height: '3px', width: '1.5em' }}></div>
			<div style={{ borderTop: `2px solid var(--${children})`, height: '3px', width: '1.5em' }}></div>
			<div style={{ borderTop: `3px solid var(--${children})`, height: '3px', width: '1.5em' }}></div>
		</Stack>
	</div>
)

const PropertyBorder = ({ children }: { children: string }) => (
	<Stack horizontal gap="gap" align="center">
		<PropertyBorderPreview>{children}</PropertyBorderPreview>
		<span style={{ fontSize: '0.8125em', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>
	</Stack>
)

const PropertyBackgroundColor = ({ children }: { children: string }) => <>
	{[
		children,
		`${children}--highlighted`,
		`${children}--pressed`,
	].map((children, i) => <Stack key={i} horizontal gap="gap" align="center">
		<div style={{
			height: swatchSize,
			minHeight: swatchSize,
			width: swatchSize,
			minWidth: swatchSize,
			backgroundColor: `var(--${children})`,
			borderRadius: '0.5em',
		}}>
			<TextPreview>{children.replace(/-background-/, '-')}</TextPreview>
		</div>
		<Stack gap="gap" justify="center">
			<span style={{ fontSize: '0.8125em', fontWeight: 600, whiteSpace: 'nowrap' }}>{children.replace(/-background-/, '-')}</span>
			<span style={{ fontSize: '0.8125em', fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>
		</Stack>
	</Stack>)}
</>

const ThemePreview = ({ background, belowAbove, children }: ThemePreviewProps) => <>
	<Stack
		horizontal
		className={`schema-${background}`}
		style={{
			alignItems: 'stretch',
			display: 'flex',
		}}
	>
		{colorThemes.map(theme => (
			<div key={theme} className={listClassName([
				`theme-${theme}`,
				background !== 'inherit' ? `scheme-${background + (belowAbove ? `-${belowAbove}` : '')}` : undefined,
			])} style={{
				borderRadius: '1em',
				backgroundColor: 'rgb(var(--cui-background-color--rgb-25))',
				color: 'rgb(var(--cui-color--rgb-50))',
				padding: '1em',
			}}>
				{children}
			</div>
		))}
	</Stack>
</>

export default {
	title: 'Misc/Theming & Schemes',
	component: ThemePreview,
	argTypes: {
		background: enumControl(backgrounds, 'inline-radio'),
		belowAbove: enumControl(belowAbove, 'inline-radio'),
		intent: enumControl(intents, 'inline-radio'),
		buttonScheme: enumControl(buttonSchemes, 'inline-radio'),
	},
} as ComponentMeta<typeof ThemePreview>

const Template: ComponentStory<typeof ThemePreview> = (args: ThemePreviewProps) => {
	return (
		<ThemePreview {...args}>
			<Stack gap="large">
				<Stack gap="gap" align="stretch">
					<PropertyText>cui-color</PropertyText>

					<PropertyText>cui-color--low</PropertyText>
					<PropertyText>cui-color--medium</PropertyText>
					<PropertyText>cui-color--high</PropertyText>
					<PropertyText>cui-color--strong</PropertyText>

					<PropertyBorder>cui-control-border-color</PropertyBorder>
					<PropertyBorder>cui-control-border-color--highlighted</PropertyBorder>
					<PropertyBorder>cui-control-border-color--pressed</PropertyBorder>

					<PropertyBackgroundColor>cui-control-background-color</PropertyBackgroundColor>
					<PropertyBackgroundColor>cui-toned-control-background-color</PropertyBackgroundColor>
					<PropertyBackgroundColor>cui-filled-control-background-color</PropertyBackgroundColor>
				</Stack>

				<Stack align="start">
					<Button scheme={args.buttonScheme} intent={args.intent} size="small">Button</Button>
					<Button scheme={args.buttonScheme} intent={args.intent}>Button</Button>
					<Button scheme={args.buttonScheme} intent={args.intent} size="large">Button</Button>
					<Button scheme={args.buttonScheme} intent={args.intent} size="small">Button</Button>
					<Button scheme={args.buttonScheme} intent={args.intent} distinction="outlined">Button</Button>
					<Button scheme={args.buttonScheme} intent={args.intent} distinction="seamless" size="large">Button</Button>
				</Stack>
			</Stack>
		</ThemePreview>
	)
}

export const Default = Template.bind({})

Default.args = {
	background: 'inherit',
	belowAbove: 'above',
}
