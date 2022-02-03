import { useState } from '@storybook/addons'
import type { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Checkbox } from '../../src'
import { booleanControl, disabledControlsForAttributes, enumControl, stringControl } from './Helpers'

export default {
	title: 'Checkbox',
	component: Checkbox,
	argTypes: {
		...disabledControlsForAttributes<typeof Checkbox>('CheckboxButtonComponent'),
		isDisabled: booleanControl(false),
		value: enumControl([undefined, null, true, false], 'radio', undefined),
		children: stringControl('Label'),
		labelDescription: stringControl('Description under the label'),
	},
} as ComponentMeta<typeof Checkbox>

const Template: ComponentStory<typeof Checkbox> = args => {
	const [value, setValue] = useState<boolean | null>(args.value)

	React.useEffect(() => {
		setValue(args.value)
	}, [args.value])

	return <Checkbox {...args} value={value} onChange={setValue} />
}

export const Defaut = Template.bind({})

Defaut.args = {}
