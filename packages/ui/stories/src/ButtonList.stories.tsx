import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether, Button, ButtonList } from '../../src'

export default {
	title: 'ButtonList',
	component: ButtonList,
	decorators: [
		Story => (
			<Aether style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1em', padding: '2em' }}>
				<Story />
			</Aether>
		),
	],
} as ComponentMeta<typeof ButtonList>

const Template: ComponentStory<typeof ButtonList> = args => <ButtonList {...args}>
  <Button>Default</Button>
  <Button intent="primary">Primary</Button>
  <Button intent="secondary">Secondary</Button>
  <Button intent="tertiary">Tertiary</Button>
  <Button intent="success">Success</Button>
  <Button intent="warn">Warn</Button>
  <Button intent="danger">Danger</Button>
  <Button intent="dark">Dark</Button>
</ButtonList>

export const Default = Template.bind({})

Default.args = {
}
