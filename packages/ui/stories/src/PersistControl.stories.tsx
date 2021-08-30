import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { PersistControl } from '../../src'

export default {
	title: 'PersistControl',
	component: PersistControl,
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
} as ComponentMeta<typeof PersistControl>

const Template: ComponentStory<typeof PersistControl> = args => <PersistControl {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
	isDirty: false,
	isMutating: false,
	onSave: () => console.log('Save'),
}

export const Translated = Template.bind({})

Translated.args = {
	isDirty: false,
	isMutating: false,
	label: 'Uložit',
	labelSaved: 'Uloženo',
	onSave: () => console.log('Save'),
}
