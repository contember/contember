import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Button } from '../../src'

export default {
	title: 'Button',
	component: Button,
	decorators: [
		Story => <>
      <p style={{ flex: '100% 1 1' }}>This is a text with normal weight that is not clickable. And here's some <a href="#">link</a> that is clickable. Buttons should have enough clickable visual affordance event when seamless.</p>
      <Story />
		</>,
	],
  argTypes: {
    disabled: { defaultValue: false },
    bland: { defaultValue: false },
    isActive: { defaultValue: false },
    isLoading: { defaultValue: false },
  },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = args => <>
  <Button {...args}>Default</Button>
  <Button {...args} intent="primary">Primary</Button>
  <Button {...args} intent="secondary">Secondary</Button>
  <Button {...args} intent="tertiary">Tertiary</Button>
  <Button {...args} intent="success">Success</Button>
  <Button {...args} intent="warn">Warn</Button>
  <Button {...args} intent="danger">Danger</Button>
  <Button {...args} intent="dark">Dark</Button>
</>

export const Default = Template.bind({})

Default.args = {
}
