import { listClassName } from '@contember/utilities'
import { InputHTMLAttributes, PureComponent } from 'react'

export interface InputGroupProps {
	large?: boolean
}

export class InputGroup extends PureComponent<InputGroupProps & InputHTMLAttributes<HTMLInputElement>> {
	public override render() {
		const { large, children, ...rest } = this.props

		return (
			<div className={listClassName(['inputGroup', large && 'view-large'])}>
				<input className="inputGroup-text" {...rest} />
			</div>
		)
	}
}
