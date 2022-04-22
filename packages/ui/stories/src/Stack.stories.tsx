import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Stack } from '../../src'
import { Block, booleanControl, numberControl } from './Helpers'

export default {
	title: 'Stack',
	component: Stack,
	argTypes: {
		grow: numberControl(0, undefined, 1, undefined),
		shrink: numberControl(0, undefined, 1, undefined),
		wrap: booleanControl(false),
	},
} as ComponentMeta<typeof Stack>

const Template: ComponentStory<typeof Stack> = args => <Stack {...args}>
	<Block />
	<Block />
	<Block />
	<Block />
	<Block />
	<Block />
	<Block style={{ flexBasis: '100%' }} />
</Stack>

export const Defaut = Template.bind({})

Defaut.args = {
	direction: 'vertical',
}
