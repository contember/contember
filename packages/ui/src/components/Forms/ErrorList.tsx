import { memo, useMemo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { FieldErrors } from '../../types'
import { Message } from '../Message'

export interface ErrorListProps {
	errors?: FieldErrors
}

export const ErrorList = memo(({ errors = [] }: ErrorListProps) => {
	const prefix = useClassNamePrefix()
	const fieldErrors = Array.isArray(errors) ? errors : errors.validation
	const messages = useMemo(() => [...new Set(fieldErrors?.map(it => it.message))], [fieldErrors])
	if (!fieldErrors || !fieldErrors.length) {
		return null
	}
	return (
		<ul className={`${prefix}errorList`}>
			{messages.map(error => (
				<li className={`${prefix}errorList-item`} key={error}>
					<Message intent="danger" size="small">
						{error}
					</Message>
				</li>
			))}
		</ul>
	)
})
ErrorList.displayName = 'ErrorList'
