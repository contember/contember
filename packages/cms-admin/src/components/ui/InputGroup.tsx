import * as React from 'react'
import cn from 'classnames'

export interface InputGroupProps {
	large?: boolean
}

export class InputGroup extends React.PureComponent<InputGroupProps & React.InputHTMLAttributes<HTMLInputElement>> {
	public render() {
		const { large, children, ...rest } = this.props

		return (
			<div className={cn('inputGroup', large && 'view-large')}>
				<input className="inputGroup-text" {...rest} />
			</div>
		)
	}
}
