import * as React from 'react'
import { FieldErrors } from '../../types'
import { ValidationMessage } from './ValidationMessage'

export interface ErrorListProps {
	errors: FieldErrors
}

export const ErrorList = React.memo(({ errors }: ErrorListProps) => {
	if (!errors.length) {
		return null
	}
	console.log('xxxx', errors)
	return (
		<ul className="errorList">
			{errors.map(error => (
				<li className="errorList-item" key={error.key}>
					<ValidationMessage type="invalid">{error.message}</ValidationMessage>
				</li>
			))}
		</ul>
	)
})
