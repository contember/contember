import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { SaveButton } from '../../src'

export default {
	title: 'SaveButton',
	component: SaveButton,
	decorators: [
		Story => <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
			<p>Container set to align children flex-start:</p>
			<div style={{ display: 'flex', gap: '1em', justifyContent: 'flex-start' }}>
					<Story />
			</div>

			<p>Container set align children center:</p>
			<div style={{ display: 'flex', gap: '1em', justifyContent: 'center' }}>
					<Story />
			</div>

			<p>Container set to align children flex-end:</p>
			<div style={{ display: 'flex', gap: '1em', justifyContent: 'flex-end' }}>
					<Story />
			</div>

			<p>Container set to stretch children:</p>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
				<Story />
			</div>
		</div>,
	],
} as ComponentMeta<typeof SaveButton>

const Template: ComponentStory<typeof SaveButton> = args => <SaveButton {...args} />

export const Defaut = Template.bind({})

Defaut.args = {}

export const Translated = Template.bind({})

Translated.args = {
	children: 'Uložit',
}
