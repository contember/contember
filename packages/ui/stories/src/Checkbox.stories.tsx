import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Checkbox } from '../../src'
import { booleanControl, disabledControlsForAttributes, enumControl, stringControl } from './Helpers'

export default {
	title: 'Checkbox',
	component: Checkbox,
	argTypes: {
		...disabledControlsForAttributes<typeof Checkbox>('errors'),
		isDisabled: booleanControl(false),
		value: enumControl([undefined, null, true, false], 'radio', undefined),
		children: stringControl('Label'),
		labelDescription: stringControl('Description under the label'),
	},
} as ComponentMeta<typeof Checkbox>

const Template: ComponentStory<typeof Checkbox> = args => <Checkbox {...args} />

export const Defaut = Template.bind({})

Defaut.args = {
	errors: [{ 'message': 'Some' }],
}
