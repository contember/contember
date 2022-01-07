import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Box, Button } from '../../src'
import { Block, booleanControl, disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Box',
	component: Box,
	argTypes: {
		...disabledControlsForAttributes<typeof Box>('actions', 'children'),
		isActive: booleanControl(false),
	},
} as ComponentMeta<typeof Box>

const Template: ComponentStory<typeof Box> = args => <Box {...args} />

export const Simple = Template.bind({})
Simple.args = {
	heading: 'Lorem ipsum',
	actions: <Button>Hi!</Button>,
	children: <>
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
	</>,
}
