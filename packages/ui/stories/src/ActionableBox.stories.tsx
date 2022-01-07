import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { ActionableBox, Aether } from '../../src'
import { disabledControlsForAttributes } from './Helpers'

export default {
	title: 'ActionableBox',
	component: ActionableBox,
	decorators: [
		Story => (
			<Aether style={{ alignItems: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1em', padding: '2em' }}>
				<button>focusable before</button>
				<Story />
				<button>focusable after</button>
			</Aether>
		),
	],
	argTypes: disabledControlsForAttributes<typeof ActionableBox>('editContents'),
} as ComponentMeta<typeof ActionableBox>

const Template: ComponentStory<typeof ActionableBox> = args => <ActionableBox {...args} />

const loremIpsum =
	'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consequatur provident, quis? Ad adipisci dolore ipsam\n' +
	'magnam modi nostrum optio quia velit! Ab aperiam consequatur consequuntur deleniti iusto libero possimus\n' +
	'tpraesentium.'

export const Simple = Template.bind({})

Simple.args = {
	editContents: <div style={{ display: 'flex', flexDirection: 'column' }}>
		<input />
		<input />
		<button>Click</button>
	</div>,
	children: loremIpsum,
}
