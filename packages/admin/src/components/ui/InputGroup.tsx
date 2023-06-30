import { listClassName } from '@contember/utilities'
import { InputHTMLAttributes, PureComponent } from 'react'

export interface InputGroupProps {
	large?: boolean
}

export class InputGroup extends PureComponent<InputGroupProps & InputHTMLAttributes<HTMLInputElement>> {
	public override render() {
		const { large, children: INTENTIONALLY_UNUSED_CHILDREN, ...rest } = this.props

		if (import.meta.env.DEV && INTENTIONALLY_UNUSED_CHILDREN) {
			console.warn('[UNUSED CHILDREN] Cannot pass children on to InputGroup.')
		}

		return (
			<div className={listClassName(['inputGroup', large && 'view-large'])}>
				<input className="inputGroup-text" {...rest} />
			</div>
		)
	}
}
