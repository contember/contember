import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { FieldContainer } from '../../src'
import { disabledControlsForAttributes } from './Helpers'

export default {
	title: 'FieldContainer',
	component: FieldContainer,
	argTypes: disabledControlsForAttributes<typeof FieldContainer>('children'),
} as ComponentMeta<typeof FieldContainer>

const Template: ComponentStory<typeof FieldContainer> = args => <FieldContainer {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
	label: 'Label',
	labelDescription: 'Hint to fill valid value',
	description: 'Description comes here',
	children: '[input component]',
}
