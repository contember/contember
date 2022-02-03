import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import type { Size } from '../../../types'
import { toEnumViewClass, toThemeClass } from '../../../utils'
import { Description } from '../../Typography/Description'
import { Label } from '../../Typography/Label'
import { ErrorList, ErrorListProps } from '../ErrorList'
import type { FieldContainerLabelPosition } from './Types'

export interface FieldContainerProps extends ErrorListProps {
	label: ReactNode
	children: ReactNode // The actual field

	size?: Size
	labelPosition?: FieldContainerLabelPosition

	labelDescription?: ReactNode // Expands on the label e.g. to provide the additional explanation
	description?: ReactNode // Can explain e.g. the kinds of values to be filled

	required?: boolean
	useLabelElement?: boolean
}

export const FieldContainer = memo(
	({
		label,
		children,
		labelPosition,
		labelDescription,
		description,
		required,
		size,
		errors,
		useLabelElement = true,
	}: FieldContainerProps) => {
		const LabelElement = useLabelElement ? 'label' : 'div'
		const componentClassName = `${useClassNamePrefix()}field-container`

		return (
			<div className={classNames(
				`${componentClassName}`,
				toEnumViewClass(size),
				toEnumViewClass(labelPosition),
				errors?.length ? toThemeClass('danger', 'controls') : undefined,
			)}>
				<LabelElement className={`${componentClassName}-label`}>
					{(label || labelDescription) && <span className={`${componentClassName}-header`}>
							{label && <Label>
								{label}
								<span className={`${componentClassName}-required-asterix ${toThemeClass('danger')}`}>{required && '*'}</span>
							</Label>}
							{labelDescription && <Description>{labelDescription}</Description>}
						</span>
					}
					{(children || description) && <div className={`${componentClassName}-body`}>
						{children && <span className={`${componentClassName}-body-content`}>{children}</span>}
						{description && <span className={`${componentClassName}-body-content-description`}>{description}</span>}
					</div>}
				</LabelElement>
				{!!errors && (
					<div className={`${componentClassName}-errors`}>
						<ErrorList errors={errors} />
					</div>
				)}
			</div>
		)
	},
)
FieldContainer.displayName = 'FieldContainer'
