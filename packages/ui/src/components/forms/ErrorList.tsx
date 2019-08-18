import * as React from 'react'
import { FieldErrors } from '../../types'
import { ValidationMessage, ValidationMessageProps } from './ValidationMessage'

export interface ErrorListProps {
	errors?: FieldErrors
	size?: ValidationMessageProps['size']
}

export const ErrorList = React.memo(({ errors, size }: ErrorListProps) => {
	if (!errors || !errors.length) {
		return null
	}
	return (
		<ul className="errorList">
			{errors.map(error => (
				<li className="errorList-item" key={error.key}>
					<ValidationMessage type="invalid" size={size}>
						{error.message}
					</ValidationMessage>
				</li>
			))}
		</ul>
	)
})
