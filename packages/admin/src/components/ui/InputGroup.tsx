import cn from 'classnames'
import { InputHTMLAttributes, PureComponent } from 'react'

export interface InputGroupProps {
	large?: boolean
}

export class InputGroup extends PureComponent<InputGroupProps & InputHTMLAttributes<HTMLInputElement>> {
	public override render() {
		const { large, children, ...rest } = this.props

		return (
			<div className={cn('inputGroup', large && 'view-large')}>
				<input className="inputGroup-text" {...rest} />
			</div>
		)
	}
}
