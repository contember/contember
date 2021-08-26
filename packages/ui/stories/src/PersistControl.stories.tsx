import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether, PersistControl } from '../../src'

export default {
	title: 'PersistControl',
	component: PersistControl,
	decorators: [
		Story => (<>
			<p>Container set to align children flex-start:</p>
			<Aether style={{ display: 'flex', gap: '1em', justifyContent: 'flex-start', padding: '2em' }}>
					<Story />
			</Aether>

			<p>Container set align children center:</p>
			<Aether style={{ display: 'flex', gap: '1em', justifyContent: 'center', padding: '2em' }}>
					<Story />
			</Aether>

			<p>Container set to align children flex-end:</p>
			<Aether style={{ display: 'flex', gap: '1em', justifyContent: 'flex-end', padding: '2em' }}>
					<Story />
			</Aether>

			<p>Container set to stretch children:</p>
			<Aether style={{ display: 'flex', flexDirection: 'column', gap: '1em', padding: '2em' }}>
				<Story />
			</Aether>
			</>
		),
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
