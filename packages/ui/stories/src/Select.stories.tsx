import { useCallback, useState } from '@storybook/addons'
import { ComponentMeta, ComponentStory, forceReRender } from '@storybook/react'
import * as React from 'react'
import { HTMLReactSelectElement, Select } from '../../src'
import { Button } from '../ui/Button'
import { booleanControl, disabledControlsForAttributes } from './Helpers'

export default {
	title: 'Forms/Select',
	component: Select,
	argTypes: {
		...disabledControlsForAttributes<typeof Select>('options'),
		active: booleanControl(false),
		disabled: booleanControl(false),
		loading: booleanControl(false),
		readOnly: booleanControl(false),
		required: booleanControl(false),
	},
	args: {
		options: [],
		placeholder: 'Set value...',
	},
} as ComponentMeta<typeof Select>

const Template: ComponentStory<typeof Select> = args => {
	const ref = React.useRef<HTMLReactSelectElement<typeof args.options[number]['value']>>(null)
	const [value, setValue] = useState<unknown | null | undefined>(args.value as unknown)
	const [error, setError] = useState<string | undefined>(undefined)
	const [touched, setTouched] = useState<boolean | undefined>(undefined)

	const onChange = useCallback((value?: unknown | null) => {
		setValue(value)
		forceReRender()
		console.log('Changed value:', value)
	}, [])

	React.useEffect(() => {
		setValue(args.value)
		forceReRender()
	}, [args.value])

	return <>
		<Select
			ref={ref}
			validationState={touched && error ? 'invalid' : undefined}
			{...args}
			defaultValue={args.defaultValue}
			value={value}
			onChange={onChange}
			onBlur={useCallback(() => {
				setTouched(true)
			}, [setTouched])}
			onValidationStateChange={setError}
		/>
		<div>Validation error: {error ?? 'Valid'}</div>
		<div>Value set: {JSON.stringify(value)}</div>
		<div>touched: {touched ? 'yes' : 'no'}</div>
		<Button onClick={() => {
			setTouched(false)
		}}>Reset touched state</Button>
	</>
}

export const Defaut = Template.bind({})

Defaut.args = {
	options: [{
		value: '1',
		label: 'Fist option',
	}, {
		value: '2',
		label: 'Second option',
	}, {
		value: '3',
		label: 'Third option',
	}],
}

export const Custom_Empty_Option = Template.bind({})

Custom_Empty_Option.args = {
	options: [{
		value: null,
		label: 'Set fancy value...',
	}, {
		value: '1',
		label: 'Fist option',
	}, {
		value: '2',
		label: 'Second option',
	}, {
		value: '3',
		label: 'Third option',
	}],
}

export const Numeric = Template.bind({})

Numeric.args = {
	options: [{
		value: 1,
		label: 'Fist option',
	}, {
		value: 2,
		label: 'Second option',
	}, {
		value: 3,
		label: 'Third option',
	}],
}

export const Numeric_Strict = Template.bind({})

Numeric_Strict.args = {
	required: true,
	options: [{
		value: 1,
		label: 'Fist option',
	}, {
		value: 2,
		label: 'Second option',
	}, {
		value: 3,
		label: 'Third option',
	}],
}

export const Mixed_Values = Template.bind({})

Mixed_Values.args = {
	options: [{
		value: [1, 2, 3],
		label: 'Array of numbers',
	}, {
		value: { message: 'Hello world' },
		label: 'Object with message',
	}, {
		value: new Date(),
		label: 'Date object',
	}],
}

export const Boolean_Values = Template.bind({})

Boolean_Values.args = {
	notNull: true,
	options: [{
		value: true,
		label: 'On',
	}, {
		value: false,
		label: 'Off',
	}],
}
