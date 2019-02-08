import * as React from 'react'
import cn from 'classnames'

export interface FormGroupProps {
	label: React.ReactNode
	// size?: AvatarSize
	// shape?: AvatarShape
}

export const FormGroup: React.FunctionComponent<FormGroupProps> = props => {
	const { label, children } = props

	return (
		<div className={cn('formGroup')}>
			<div className="formGroup-label">{label}</div>
			<div className="formGroup-field">{children}</div>
		</div>
	)
}
