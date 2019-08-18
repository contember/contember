import cn from 'classnames'
import * as React from 'react'
import { FormGroupLabelPosition } from '../../types'
import { toViewClass } from '../../utils'
import { ErrorList, ErrorListProps } from './'

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement>, ErrorListProps {
	label: React.ReactNode
	children: React.ReactNode // The actual field

	labelPosition?: FormGroupLabelPosition

	labelDescription?: React.ReactNode // Expands on the label e.g. to provide the additional explanation
	description?: React.ReactNode // Can explain e.g. the kinds of values to be filled
}

export const FormGroup = React.memo(
	({
		label,
		children,
		className,
		labelPosition,
		labelDescription,
		description,
		size,
		errors,
		...divProps
	}: FormGroupProps) => {
		return (
			<div className={cn(className, 'formGroup', toViewClass(size), toViewClass(labelPosition))} {...divProps}>
				<label className="formGroup-label">
					{label && <span className="formGroup-label-text">{label}</span>}
					{labelDescription && <span className="formGroup-labelDescription">{labelDescription}</span>}
					<span className="formGroup-field">{children}</span>
					{description && <span className="formGroup-description">{description}</span>}
				</label>
				<ErrorList errors={errors} size={size} />
			</div>
		)
	},
)
