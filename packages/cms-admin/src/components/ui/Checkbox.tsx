import { ErrorList } from '@contember/ui'
import * as React from 'react'
import { ErrorAccessor } from '../../binding/dao'
import { FieldErrors } from '@contember/ui/dist/src/types'

export interface CheckboxProps {
	checked: boolean
	readOnly?: boolean
	errors?: FieldErrors
	onChange: (isChecked: boolean) => void
	children: React.ReactNode
}

export const Checkbox = React.memo((props: CheckboxProps) => (
	<div className="checkbox">
		<ErrorList errors={props.errors} />
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
