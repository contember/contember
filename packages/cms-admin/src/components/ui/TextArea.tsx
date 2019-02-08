import * as React from 'react'
import cn from 'classnames'

export interface TextAreaProps {
	large?: boolean
}

export const TextArea: React.FunctionComponent<
	TextAreaProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = props => {
	const { large, children, ...rest } = props

	return (
		<div className={cn('inputGroup', large && 'view-large')}>
			<textarea className="inputGroup-text" {...rest} />
		</div>
	)
}
