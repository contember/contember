import * as React from 'react'
import { FieldErrors } from '../../types'
import { Message, MessageProps } from './Message'

export interface ErrorListProps {
	errors?: FieldErrors
	size?: MessageProps['size']
}

export const ErrorList = React.memo(({ errors, size }: ErrorListProps) => {
	if (!errors || !errors.length) {
		return null
	}
	return (
		<ul className="errorList">
			{errors.map(error => (
				<li className="errorList-item" key={error.message}>
					<Message type="danger" size={size}>
						{error.message}
					</Message>
				</li>
			))}
		</ul>
	)
})
ErrorList.displayName = 'ErrorList'
