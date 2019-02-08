import * as React from 'react'
import cn from 'classnames'

export interface InputGroupProps {
	inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

export const InputGroup: React.FunctionComponent<InputGroupProps> = props => {
	const { inputProps, children } = props

	return (
		<div className="inputGroup">
			<input className="inputGroup-text" {...inputProps} />
		</div>
	)
}
