import cn from 'classnames'
import * as React from 'react'
import { FormGroupLabelPosition, Size } from '../../types'
import { toEnumViewClass } from '../../utils'
import { ErrorList, ErrorListProps } from './'

export interface FormGroupProps extends ErrorListProps {
	label: React.ReactNode
	children: React.ReactNode // The actual field

	size?: Size
	labelPosition?: FormGroupLabelPosition

	labelDescription?: React.ReactNode // Expands on the label e.g. to provide the additional explanation
	description?: React.ReactNode // Can explain e.g. the kinds of values to be filled

	useLabelElement?: boolean
}

export const FormGroup = React.memo(
	({
		label,
		children,
		labelPosition,
		labelDescription,
		description,
		size,
		errors,
		useLabelElement = true,
	}: FormGroupProps) => {
		const LabelElement = useLabelElement ? 'label' : 'div'
		return (
			<div className={cn('formGroup', toEnumViewClass(size), toEnumViewClass(labelPosition))}>
				<LabelElement className="formGroup-label">
					{(label || labelDescription) && (
						<span className="formGroup-label-wrap">
							{label && <span className="formGroup-label-text">{label}</span>}
							{labelDescription && <span className="formGroup-labelDescription">{labelDescription}</span>}
						</span>
					)}
					<span className="formGroup-field-wrap">{children}</span>
					{description && <span className="formGroup-field-description">{description}</span>}
				</LabelElement>
				{!!(errors && errors.length) && (
					<div className="formGroup-errors">
						<ErrorList errors={errors} size={size} />
					</div>
				)}
			</div>
		)
	},
)
FormGroup.displayName = 'FormGroup'
