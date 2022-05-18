import type { ComponentMeta, ComponentStory } from '@storybook/react'
import { FieldContainer } from '../../src'
import { Block, disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Containers/FieldContainer',
	component: FieldContainer,
	argTypes: disabledControlsForAttributes<typeof FieldContainer>('children'),
} as ComponentMeta<typeof FieldContainer>

const Template: ComponentStory<typeof FieldContainer> = args => <FieldContainer {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
	label: 'Label',
	labelDescription: 'Hint to fill valid value',
	description: 'Description comes here',
	children: <Block />,
	errors: [
		{ message: 'Error message lorem ipsum' },
		{ message: 'Dolor error message' },
		{ message: 'Error message sit amet' },
	],
}
