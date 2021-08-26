import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether } from '../../src'
import { disabledControlsFromAttributes } from './helpers'

export default {
	title: 'Aether',
	component: Aether,
  argTypes: disabledControlsFromAttributes(['children', 'ref', 'style']),
} as ComponentMeta<typeof Aether>

const Template: ComponentStory<typeof Aether> = args => <Aether {...args} />

export const Simple = Template.bind({})

Simple.args = {
  style: { overflow: 'auto' },
	children: <div style={{ background: '#FA0', margin: '2em', padding: '1em', textAlign: 'center' }}>
    Aether is the container around this content.
  </div>,
}
