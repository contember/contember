import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { FieldErrors } from '../../types'
import { Message } from '../Message'

export interface ErrorListProps {
	errors?: FieldErrors
}

export const ErrorList = memo(({ errors }: ErrorListProps) => {
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
					<Message intent="danger" size="small">
						{error.message}
					</Message>
				</li>
			))}
		</ul>
	)
})
ErrorList.displayName = 'ErrorList'
