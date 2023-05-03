import { useCallback, useState } from '@storybook/addons'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Checkbox } from '../../src'
import { booleanControl, disabledControlsForAttributes, enumControl } from './Helpers'

export default {
	title: 'Forms/Checkbox',
	component: Checkbox,
	argTypes: {
		...disabledControlsForAttributes<typeof Checkbox>('CheckboxButtonComponent'),
		active: booleanControl(false),
		disabled: booleanControl(false),
		defaultValue: booleanControl(false),
		value: enumControl([undefined, null, true, false], 'radio', undefined),
	},
} as ComponentMeta<typeof Checkbox>

const Template: ComponentStory<typeof Checkbox> = (args: {
	value?: boolean | undefined | null;
}) => {
	const [value, setValue] = useState<boolean | undefined | null>(args.value)

	const onChange = useCallback((value?: boolean | null) => {
		setValue(value)
	}, [])

	React.useEffect(() => {
		setValue(args.value)
	}, [args.value])

	return <>
		<Checkbox {...args} value={value} onChange={onChange} />
		<div>value: {JSON.stringify(value)}</div>
	</>
}

export const Default = Template.bind({})

Default.args = {}
