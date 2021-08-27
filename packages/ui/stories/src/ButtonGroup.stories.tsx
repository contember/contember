import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Aether, Button, ButtonGroup } from '../../src'

export default {
	title: 'ButtonGroup',
	component: ButtonGroup,
	decorators: [
		Story => (
			<Aether style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1em', padding: '2em' }}>
				<Story />
			</Aether>
		),
	],
} as ComponentMeta<typeof ButtonGroup>

const Template: ComponentStory<typeof ButtonGroup> = args => <ButtonGroup {...args}>
  <Button>Default</Button>
  <Button intent="primary">Primary</Button>
  <Button intent="secondary">Secondary</Button>
  <Button intent="tertiary">Tertiary</Button>
  <Button intent="success">Success</Button>
  <Button intent="warn">Warn</Button>
  <Button intent="danger">Danger</Button>
  <Button intent="dark">Dark</Button>
</ButtonGroup>

export const Default = Template.bind({})

Default.args = {
}
