import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { AnchorButton, Button, ButtonProps, Intent, Justification, Scheme, Size } from '../../src'
import { booleanControl, enumControl } from './Helpers'

const intents: Intent[] = ['default', 'primary', 'secondary', 'tertiary', 'positive', 'success', 'warn', 'danger']
const schemes: Scheme[] = ['system', 'light', 'dark']
const sizes: Size[] = ['default', 'small', 'large']
const distinctions: ButtonProps['distinction'][] = ['primary', 'toned', 'outlined', 'seamless']
const justifications: Justification[] = ['default', 'justifyStart', 'justifyCenter', 'justifyEnd']

export default {
	title: 'Forms/Button',
	component: Button,
	decorators: [
		Story => <>
			<p style={{ flex: '1 1 100%' }}>This is a text with normal weight that is not clickable. And here&apos;s some <a href="#">link</a> that is clickable. Buttons should have enough clickable visual affordance event when seamless.</p>
			<Story />
		</>,
	],
	/**
	 * TODO: Remove manual overrides below when the issue is fixed
	 *
	 * Storybook Controls bails out of inferring the knobs automatically.
	 * Same as https://github.com/storybookjs/storybook/issues/15896
	 * but workaround fails to work.
	 *
	 * Related Issues that are still open and possibly affecting:
	 *
	 * - https://github.com/styleguidist/react-docgen-typescript/issues/393
	 * - https://github.com/styleguidist/react-docgen-typescript/issues/323
	 * - https://github.com/strothj/react-docgen-typescript-loader/issues/10
	 */
	argTypes: {
		active: booleanControl(false),
		disabled: booleanControl(false),
		distinction: enumControl(distinctions, 'inline-radio', 'default'),
		intent: enumControl(intents, 'select', 'default'),
		justification: enumControl(justifications, 'inline-radio', 'default'),
		loading: booleanControl(false),
		scheme: enumControl(schemes, 'select', undefined),
		size: enumControl(sizes, 'inline-radio', 'default'),
	},
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = args => <>
	<Button {...args}>Default</Button>
	<AnchorButton
		href="#"
		size={args.size}
		intent={args.intent}
		distinction={args.distinction}
		disabled={args.disabled}
		active={args.active}
		loading={args.loading}
		scheme={args.scheme}
	>Anchor</AnchorButton>

	<p style={{ flex: '1 1 100%' }}><strong>Important:</strong> If you use intent, without the scheme, the system preferred scheme is used:</p>

	<Button {...args} intent="primary">Primary</Button>
	<Button {...args} intent="primary">Primary with a verry very long title even for lorem ipsum</Button>
	<Button {...args} intent="secondary">Secondary</Button>
	<Button {...args} intent="tertiary">Tertiary</Button>
	<Button {...args} intent="positive">Positive</Button>
	<Button {...args} intent="success">Success</Button>
	<Button {...args} intent="warn">Warn</Button>
	<Button {...args} intent="danger">Danger</Button>
</>

export const Default = Template.bind({})

Default.args = {
}
