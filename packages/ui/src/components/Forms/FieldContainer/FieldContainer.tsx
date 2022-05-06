import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import type { Size } from '../../../types'
import { toEnumViewClass, toThemeClass } from '../../../utils'
import { Stack, StackProps } from '../../Stack'
import { Description } from '../../Typography/Description'
import { Label } from '../../Typography/Label'
import { ErrorList, ErrorListProps } from '../ErrorList'
import type { FieldContainerLabelPosition } from './Types'

export interface FieldContainerProps extends ErrorListProps {
	label: ReactNode
	children: ReactNode // The actual field
	direction?: StackProps['direction']
	gap?: Size | 'none'

	size?: Size
	labelPosition?: FieldContainerLabelPosition

	labelDescription?: ReactNode // Expands on the label e.g. to provide the additional explanation
	description?: ReactNode // Can explain e.g. the kinds of values to be filled

	required?: boolean
	useLabelElement?: boolean
}

export const FieldContainer = memo(
	({
		children,
		description,
		direction = 'vertical',
		errors,
		gap = 'small',
		label,
		labelDescription,
		labelPosition,
		required,
		size,
		useLabelElement = true,
	}: FieldContainerProps) => {
		const LabelElement = useLabelElement ? 'label' : 'div'
		const componentClassName = `${useClassNamePrefix()}field-container`

		return (
			<div className={classNames(
				`${componentClassName}`,
				toEnumViewClass(size),
				toEnumViewClass(labelPosition),
				errors?.length ? toThemeClass(null, 'danger') : null,
			)}>
				<LabelElement className={`${componentClassName}-label`}>
					{(label || labelDescription) && <span className={`${componentClassName}-header`}>
							{label && <Label>
								{label}
								<span className={`${componentClassName}-required-asterix ${toThemeClass('danger', 'danger')}`}>{required && '*'}</span>
							</Label>}
							{labelDescription && <Description>{labelDescription}</Description>}
						</span>
					}
					{(children || description) && <div className={`${componentClassName}-body`}>
						{children && <Stack
							className={`${componentClassName}-body-content`}
							direction={direction}
							gap={gap}
						>
							{children}
						</Stack>}
						{description && <span className={`${componentClassName}-body-content-description`}>{description}</span>}
					</div>}
				</LabelElement>
				{!!errors && errors.length > 0 && (
					<div className={`${componentClassName}-errors`}>
						<ErrorList errors={errors} />
					</div>
				)}
			</div>
		)
	},
)
FieldContainer.displayName = 'FieldContainer'
