import { memo, useMemo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { FieldErrors } from '../../types'
import { Message } from '../Message'

export interface ErrorListProps {
	errors?: FieldErrors
}

/**
 * @group Forms UI
 */
export const ErrorList = memo(({ errors = [] }: ErrorListProps) => {
	const prefix = useClassNamePrefix()
	const messages = useMemo(() => [...new Set(errors.map(it => it.message))], [errors])
	if (!messages.length) {
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
