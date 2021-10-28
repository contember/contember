import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { FieldErrors } from '../../types'
import { Message, MessageProps } from '../Message'

export interface ErrorListProps {
	errors?: FieldErrors
	size?: MessageProps['size']
}

export const ErrorList = memo(({ errors, size }: ErrorListProps) => {
	const prefix = useClassNamePrefix()
	if (!errors) {
		return null
	}
	const fieldErrors = Array.isArray(errors) ? errors : errors.validation
	if (!fieldErrors || !fieldErrors.length) {
		return null
	}
	return (
		<ul className={`${prefix}errorList`}>
			{fieldErrors.map(error => (
				<li className={`${prefix}errorList-item`} key={error.message}>
					<Message intent="danger" size={size}>
						{error.message}
					</Message>
				</li>
			))}
		</ul>
	)
})
ErrorList.displayName = 'ErrorList'
