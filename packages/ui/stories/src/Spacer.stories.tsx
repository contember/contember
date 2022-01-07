import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Spacer } from '../../src'
import { Block, DirectionStack } from './Helpers'

export default {
	title: 'Spacer',
	component: Spacer,
} as ComponentMeta<typeof Spacer>

const Template: ComponentStory<typeof Spacer> = args => <DirectionStack>
	<Block />
	<Spacer {...args} />
	<Block />
	<Spacer {...args} />
	<Block />
	<Spacer {...args} />
	<Block />
	<Spacer {...args} />
	<Block />
</DirectionStack>

export const Defaut = Template.bind({})

Defaut.args = {
}
