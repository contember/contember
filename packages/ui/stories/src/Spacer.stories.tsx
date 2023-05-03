import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { Spacer, SpacerProps } from '../../src'
import { Block, DirectionStack } from './Helpers'

export default {
	title: 'Layout/Spacer',
	component: Spacer,
} as ComponentMeta<typeof Spacer>

const Template: ComponentStory<typeof Spacer> = (args: SpacerProps) => <DirectionStack>
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

export const Default = Template.bind({})

Default.args = {}
