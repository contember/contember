import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { Aether } from '../../src'
import { disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Containers/Aether',
	component: Aether,
	argTypes: disabledControlsForAttributes<typeof Aether>('children', 'style'),
} as ComponentMeta<typeof Aether>

const Template: ComponentStory<typeof Aether> = args => <Aether {...args} />

export const Simple = Template.bind({})

Simple.args = {
  style: { overflow: 'auto' },
	children: <div className="theme-warn scheme-light-above" style={{
    background: 'rgb(var(--cui-background-color--rgb-25))',
    color: 'rgb(var(--cui-color--rgb-50))',
    margin: '2em',
    padding: '1em',
    textAlign: 'center',
  }}>
    Aether is the container around this content.
  </div>,
}
