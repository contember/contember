import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Button, ButtonGroup } from '../../src'

export default {
	title: 'ButtonGroup',
	component: ButtonGroup,
  argTypes: {
    isTopToolbar: { defaultValue: false },
  },
} as ComponentMeta<typeof ButtonGroup>

const Template: ComponentStory<typeof ButtonGroup> = args => <ButtonGroup {...args}>
  <Button>Default</Button>
  <Button intent="primary">Primary</Button>
  <Button intent="secondary">Secondary</Button>
  <Button disabled intent="tertiary">Tertiary</Button>
  <Button intent="success">Success</Button>
  <Button intent="warn">Warn</Button>
  <Button intent="danger">Danger</Button>
</ButtonGroup>

export const Default = Template.bind({})

Default.args = {
}
