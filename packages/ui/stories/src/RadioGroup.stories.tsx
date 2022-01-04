import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { RadioGroup } from '../../src'
import { booleanControl, disabledControlsForAttributes, enumControl, stringControl } from './Helpers'

export default {
	title: 'RadioGroup',
	component: RadioGroup,
	argTypes: {
		...disabledControlsForAttributes<typeof RadioGroup>('errors', 'options'),
		name: stringControl('foo'),
		isDisabled: booleanControl(false),
		isReadOnly: booleanControl(false),
		value: enumControl([undefined, null, 'alpha', 'beta'], 'radio', undefined),
	},
} as ComponentMeta<typeof RadioGroup>

const Template: ComponentStory<typeof RadioGroup> = args => <RadioGroup {...args} />

export const Simple = Template.bind({})

Simple.args = {
	name: 'foo',
	options: [
		{
			value: 'alpha',
			label: 'Alpha',
		},
		{
			value: 'beta',
			label: 'Beta',
		},
	],
	size: 'default',
	onChange: value => console.log(value),
}

export const WithDescriptions = Template.bind({})

WithDescriptions.args = {
	options: [
		{
			value: 'alpha',
			label: 'Alpha',
			labelDescription: 'First letter in Greek alphabet',
		},
		{
			value: 'beta',
			label: 'Beta',
			labelDescription: 'Second letter in Greek alphabet',
		},
	],
	size: 'default',
	onChange: value => console.log(value),
}

export const LongLabels = Template.bind({})

LongLabels.args = {
	name: 'foo',
	options: [
		{
			value: 'alpha',
			label:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
		},
		{
			value: 'beta',
			label:
				'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo',
		},
	],
	size: 'default',
	onChange: value => console.log(value),
}

export const Preselected = Template.bind({})

Preselected.args = {
	name: 'foo',
	options: [
		{
			value: 'alpha',
			label: 'Alpha',
		},
		{
			value: 'beta',
			label: 'Beta',
		},
	],
	size: 'default',
	value: 'beta',
	onChange: value => console.log(value),
	// errors: [{ message: 'Wrong' }],
}

export const WithErrors = Template.bind({})

WithErrors.args = {
	name: 'foo',
	options: [
		{
			value: 'alpha',
			label: 'Alpha',
		},
		{
			value: 'beta',
			label: 'Beta',
		},
	],
	size: 'default',
	onChange: value => console.log(value),
	errors: [{ message: 'Select at least one' }],
	validationState: 'invalid',
}
