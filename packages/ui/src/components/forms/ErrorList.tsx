import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { FieldErrors } from '../../types'
import { Message, MessageProps } from './Message'

export interface ErrorListProps {
	errors?: FieldErrors
	size?: MessageProps['size']
}

export const ErrorList = React.memo(({ errors, size }: ErrorListProps) => {
	const prefix = useClassNamePrefix()
	if (!errors || !errors.length) {
		return null
	}
	return (
		<ul className={`${prefix}errorList`}>
			{errors.map(error => (
				<li className={`${prefix}errorList-item`} key={error.message}>
					<Message type="danger" size={size}>
						{error.message}
					</Message>
				</li>
			))}
		</ul>
	)
})
ErrorList.displayName = 'ErrorList'
