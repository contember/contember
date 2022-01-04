import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Box, Button } from '../../src'
import { booleanControl, disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Box',
	component: Box,
	argTypes: {
		...disabledControlsForAttributes<typeof Box>('actions'),
		isActive: booleanControl(false),
	},
} as ComponentMeta<typeof Box>

const Template: ComponentStory<typeof Box> = args => <Box {...args} />

export const Simple = Template.bind({})
Simple.args = {
	heading: 'Lorem ipsum',
	actions: <Button>Hi!</Button>,
	children:
		'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi consequatur dolor, doloribus esse expedita illum iste maxime, nam quam quos, ut veniam. Corporis dicta dignissimos eaque nam odio praesentium ut?',
}
