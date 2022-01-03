import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Divider } from '../../src'
import { Block, DirectionStack } from './Helpers'

export default {
	title: 'Divider',
	component: Divider,
} as ComponentMeta<typeof Divider>

const Template: ComponentStory<typeof Divider> = args => <DirectionStack>
	<Block />
	<Divider {...args} />
	<Block />
	<Divider {...args} />
	<Block />
	<Divider {...args} />
	<Block />
	<Divider {...args} />
	<Block />
</DirectionStack>

export const Defaut = Template.bind({})

Defaut.args = {
}
