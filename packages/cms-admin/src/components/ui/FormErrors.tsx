import * as React from 'react'
import { ErrorAccessor } from '../../binding/dao'

export interface FormErrorsProps {
	errors?: ErrorAccessor[]
}

export const FormErrors = React.memo((props: FormErrorsProps) => {
	if (!props.errors || !props.errors.length) {
		return null
	}
	return (
		<ul className="formErrors">
			{props.errors.map(error => (
				<li key={error.key} className="formErrors-message">
					{error.message}
				</li>
			))}
		</ul>
	)
})
