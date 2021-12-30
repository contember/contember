import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { ErrorList, ErrorListProps } from '..'
import { useClassNamePrefix } from '../../../auxiliary'
import type { FieldContainerLabelPosition, Size } from '../../../types'
import { toEnumViewClass } from '../../../utils'
import { Description } from '../../Typography/Description'
import { FieldLabel } from '../../Typography/FieldLabel'

export interface FieldContainerProps extends ErrorListProps {
	label: ReactNode
	children: ReactNode // The actual field

	size?: Size
	labelPosition?: FieldContainerLabelPosition

	labelDescription?: ReactNode // Expands on the label e.g. to provide the additional explanation
	description?: ReactNode // Can explain e.g. the kinds of values to be filled

	useLabelElement?: boolean
}

export const FieldContainer = memo(
	({
		label,
		children,
		labelPosition,
		labelDescription,
		description,
		size,
		errors,
		useLabelElement = true,
	}: FieldContainerProps) => {
		const LabelElement = useLabelElement ? 'label' : 'div'
		const prefix = useClassNamePrefix()

		return (
			<div className={cn(`${prefix}fieldContainer`, toEnumViewClass(size), toEnumViewClass(labelPosition))}>
				<LabelElement className={`${prefix}fieldContainer-label`}>
					{(label || labelDescription) && (
						<span className={`${prefix}fieldContainer-label-wrap`}>
							{label && <FieldLabel>{label}</FieldLabel>}
							{labelDescription && <Description>{labelDescription}</Description>}
						</span>
					)}
					<span className={`${prefix}fieldContainer-field-wrap`}>{children}</span>
					{description && <span className={`${prefix}fieldContainer-field-description`}>{description}</span>}
				</LabelElement>
				{!!errors && (
					<div className={`${prefix}fieldContainer-errors`}>
						<ErrorList errors={errors} size={size} />
					</div>
				)}
			</div>
		)
	},
)
FieldContainer.displayName = 'FieldContainer'
