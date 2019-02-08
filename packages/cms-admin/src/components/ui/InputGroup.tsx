import * as React from 'react'
import cn from 'classnames'

export interface InputGroupProps {
	foo?: string
}

export const InputGroup: React.FunctionComponent<
	InputGroupProps & React.InputHTMLAttributes<HTMLInputElement>
> = props => {
	const { foo, children, ...rest } = props

	return (
		<div className="inputGroup">
			<input className="inputGroup-text" {...rest} />
		</div>
	)
}
