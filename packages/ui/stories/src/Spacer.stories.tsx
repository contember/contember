import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Spacer } from '../../src'

export default {
	title: 'Spacer',
	component: Spacer,
} as ComponentMeta<typeof Spacer>

const Template: ComponentStory<typeof Spacer> = args => <div style={{ width: '100%' }}>
		<div style={{ background: 'red', height: '20px', width: '100%' }} />
		<Spacer {...args} />
		<div style={{ background: 'red', height: '20px', width: '100%' }} />
</div>

export const Defaut = Template.bind({})

Defaut.args = {
}
