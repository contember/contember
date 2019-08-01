import * as React from 'react'

export interface CheckboxProps {
	checked: boolean
	readOnly?: boolean
	label: React.ReactNode
	onChange: (isChecked: boolean) => void
}

export const Checkbox = React.memo((props: CheckboxProps) => (
	<div>
		<label>
			<input
				type="checkbox"
				checked={props.checked}
				readOnly={props.readOnly}
				onChange={e => props.onChange(e.currentTarget.checked)}
			/>
			{props.label}
		</label>
	</div>
))
