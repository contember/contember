import cn from 'classnames'
import * as React from 'react'
import { FormErrors, FormErrorsProps } from './FormErrors'

export interface FormGroupProps extends FormErrorsProps {
	label?: React.ReactNode
	horizontal?: boolean
	// size?: AvatarSize
	// shape?: AvatarShape
}

export class FormGroup extends React.PureComponent<FormGroupProps> {
	public render() {
		const { label, children, horizontal } = this.props

		return (
			<div className={cn('formGroup', horizontal && 'formGroup-horizontal')}>
				{label && <div className="formGroup-label">{label}</div>}
				<FormErrors errors={this.props.errors} />
				<div className="formGroup-field">{children}</div>
			</div>
		)
	}
}
