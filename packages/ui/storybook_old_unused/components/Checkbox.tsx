import { storiesOf } from '@storybook/react'
import { useState } from 'react'
import { Checkbox, CheckboxProps } from '../../src'

const CheckboxWrapper = (props: Omit<CheckboxProps, 'value' | 'onChange'> & { defaultValue: boolean | null }) => {
	const { defaultValue, ...checkboxProps } = props
	const [value, setValue] = useState<boolean | null>(defaultValue)
	return (
		<div style={{ marginTop: '0.5em' }}>
			<Checkbox value={value} onChange={setValue} {...checkboxProps}>
				{props.children}
			</Checkbox>
		</div>
	)
}

storiesOf('Checkbox', module)
	.add('simple', () => (
		<>
			<CheckboxWrapper defaultValue={null}>Indeterminate</CheckboxWrapper>
			<CheckboxWrapper defaultValue={false}>Unchecked</CheckboxWrapper>
			<CheckboxWrapper defaultValue={true}>Checked</CheckboxWrapper>

			<CheckboxWrapper defaultValue={null} isDisabled>
				Indeterminate disabled
			</CheckboxWrapper>
			<CheckboxWrapper defaultValue={false} isDisabled>
				Unchecked disabled
			</CheckboxWrapper>
			<CheckboxWrapper defaultValue={true} isDisabled>
				Checked disabled
			</CheckboxWrapper>
		</>
	))
	.add('with label description', () => (
		<>
			<CheckboxWrapper defaultValue={null} labelDescription="Yo, check this">
				Indeterminate
			</CheckboxWrapper>
			<CheckboxWrapper defaultValue={false} labelDescription="Yo, check this">
				Unchecked
			</CheckboxWrapper>
			<CheckboxWrapper defaultValue={true} labelDescription="Yo, check this">
				Checked
			</CheckboxWrapper>
		</>
	))
	.add('with errors', () => (
		<>
			<CheckboxWrapper defaultValue={null} errors={[{ message: 'You need to check this!' }]} validationState="invalid">
				Indeterminate
			</CheckboxWrapper>
			<CheckboxWrapper defaultValue={false} errors={[{ message: 'You need to check this!' }]} validationState="invalid">
				Unchecked
			</CheckboxWrapper>
			<CheckboxWrapper defaultValue={true} errors={[{ message: 'You need to check this!' }]} validationState="invalid">
				Checked
			</CheckboxWrapper>
		</>
	))
