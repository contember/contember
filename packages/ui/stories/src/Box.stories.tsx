import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { Box, Button } from '../../src'
import { Block, booleanControl, disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Containers/Box',
	component: Box,
	argTypes: {
		...disabledControlsForAttributes<typeof Box>('actions', 'children'),
		isActive: booleanControl(false),
	},
} as ComponentMeta<typeof Box>

const Template: ComponentStory<typeof Box> = (args: any) => <Box {...args} />

export const Simple = Template.bind({})
Simple.args = {
	actions: <Button>Hi!</Button>,
	children: <>
		<Block />
		<Block />
		<Block />
		<Block />
		<Block />
	</>,
}
