import * as React from 'react'
import cn from 'classnames'

export interface FormGroupProps {
	label: React.ReactNode
	// size?: AvatarSize
	// shape?: AvatarShape
}

export class FormGroup extends React.PureComponent<FormGroupProps> {
	public render() {
		const { label, children } = this.props

		return (
			<div className={cn('formGroup')}>
				<div className="formGroup-label">{label}</div>
				<div className="formGroup-field">{children}</div>
			</div>
		)
	}
}
