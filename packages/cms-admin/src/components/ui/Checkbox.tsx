import * as React from 'react'
import { ErrorAccessor } from '../../binding/dao'
import { FormErrors } from './FormErrors'

export interface CheckboxProps {
	checked: boolean
	readOnly?: boolean
	errors?: ErrorAccessor[]
	onChange: (isChecked: boolean) => void
	children: React.ReactNode
}

export const Checkbox = React.memo((props: CheckboxProps) => (
	<div className="checkbox">
		<FormErrors errors={props.errors} />
		<label className="checkbox-in">
			<input
				type="checkbox"
				checked={props.checked}
				readOnly={props.readOnly}
				onChange={e => props.onChange(e.currentTarget.checked)}
			/>
			<span className="checkbox-label">{props.children}</span>
			<span className="checkbox-box" />
		</label>
	</div>
))
