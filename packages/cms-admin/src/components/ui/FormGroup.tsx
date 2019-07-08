import * as React from 'react'
import cn from 'classnames'

export interface FormGroupProps {
	label?: React.ReactNode
	horizontal?: boolean
	// size?: AvatarSize
	// shape?: AvatarShape
}

export class FormGroup extends React.PureComponent<FormGroupProps> {
	public render() {
		const { label, children, horizontal } = this.props

		return (
			<div className={cn('formGroup', horizontal ? 'formGroup-horizontal' : undefined)}>
				{label && <div className="formGroup-label">{label}</div>}
				<div className="formGroup-field">{children}</div>
			</div>
		)
	}
}
