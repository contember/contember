import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Box } from '../../src'


export default {
	title: 'Box',
	component: Box,
} as ComponentMeta<typeof Box>

const Template: ComponentStory<typeof Box> = args => <Box {...args} />

export const Simple = Template.bind({})
Simple.args = {
	heading: 'Lorem ipsum',
	children:
		'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi consequatur dolor, doloribus esse expedita illum iste maxime, nam quam quos, ut veniam. Corporis dicta dignissimos eaque nam odio praesentium ut?',
}
