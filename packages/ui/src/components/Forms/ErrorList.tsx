import { useClassNameFactory } from '@contember/utilities'
import { memo, useMemo } from 'react'
import type { FieldErrors } from '../../types'
import { Message } from '../Message'

export interface ErrorListProps {
	errors?: FieldErrors
}

/**
 * @group Forms UI
 */
export const ErrorList = memo(({ errors = [] }: ErrorListProps) => {
	const messages = useMemo(() => [...new Set(errors.map(it => it.message))], [errors])
	const componentClassName = useClassNameFactory('errorList')

	if (!messages.length) {
		return null
	}

	return (
		<ul className={componentClassName()}>
			{messages.map(error => (
				<li className={componentClassName('item')} key={error}>
					<Message intent="danger" size="small">
						{error}
					</Message>
				</li>
			))}
		</ul>
	)
})
ErrorList.displayName = 'ErrorList'
