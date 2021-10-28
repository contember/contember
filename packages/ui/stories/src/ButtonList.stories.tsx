import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Button, ButtonList } from '../../src'

export default {
	title: 'ButtonList',
	component: ButtonList,
} as ComponentMeta<typeof ButtonList>

const Template: ComponentStory<typeof ButtonList> = args => <ButtonList {...args}>
  <Button>Default</Button>
  <Button intent="primary">Primary</Button>
  <Button intent="secondary">Secondary</Button>
  <Button intent="tertiary">Tertiary</Button>
  <Button intent="success">Success</Button>
  <Button intent="warn">Warn</Button>
  <Button intent="danger">Danger</Button>
</ButtonList>

export const Default = Template.bind({})

Default.args = {
}
