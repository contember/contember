import classNames from 'classnames'
import { CSSProperties, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import type { Size } from '../../../types'
import { toEnumClass, toEnumViewClass, toThemeClass } from '../../../utils'
import { Stack, StackProps } from '../../Stack'
import { Description } from '../../Typography'
import { Label } from '../../Typography'
import { ErrorList, ErrorListProps } from '../ErrorList'
import type { FieldContainerLabelPosition } from './Types'

export type FieldContainerProps =
	& {
		children: ReactNode // The actual field
		description?: ReactNode // Can explain e.g. the kinds of values to be filled
		direction?: StackProps['direction']
		gap?: Size | 'none'
		label: ReactNode
		labelDescription?: ReactNode // Expands on the label e.g. to provide the additional explanation
		labelPosition?: FieldContainerLabelPosition
		width?: 'column' | 'fluid' | 'none'
		required?: boolean
		size?: Size
		useLabelElement?: boolean
		style?: CSSProperties
		className?: string
	}
	& ErrorListProps

/**
 * @group Forms UI
 */
export const FieldContainer = memo(
	({
		children,
		className,
		description,
		direction = 'vertical',
		errors,
		gap = 'small',
		label,
		labelDescription,
		labelPosition,
		required,
		size,
		style,
		useLabelElement = true,
		width = 'column',
	}: FieldContainerProps) => {
		const LabelElement = useLabelElement ? 'label' : 'div'
		const componentClassName = `${useClassNamePrefix()}field-container`

		const isLabelInline = labelPosition === 'labelInlineLeft' || labelPosition === 'labelInlineRight'
		const invalid = !!errors?.length

		return (
			<div
				data-invalid={invalid ? true : undefined}
				style={style}
				className={classNames(
					`${componentClassName}`,
					toEnumViewClass(size),
					toEnumViewClass(labelPosition),
					toEnumClass('width-', width === 'none' ? undefined : width),
					invalid ? toThemeClass(null, 'danger') : null,
					className,
				)}
			>
				<LabelElement className={`${componentClassName}-label`}>
					{(label || labelDescription) && <span className={`${componentClassName}-header`}>
						{label && <Label>
							{label}
							<span className={`${componentClassName}-required-asterix ${toThemeClass('danger', 'danger')}`}>{required && '*'}</span>
						</Label>}
						{labelDescription && <Description>{labelDescription}</Description>}
					</span>
					}
					{(children || (!isLabelInline && description)) && <div className={`${componentClassName}-body`}>
						{children && <Stack
							className={`${componentClassName}-body-content`}
							direction={direction}
							gap={gap}
						>
							{children}
						</Stack>}
						{!isLabelInline && description && <span className={`${componentClassName}-body-content-description`}>{description}</span>}
					</div>}
				</LabelElement>
				{isLabelInline && description && <span className={`${componentClassName}-body-content-description`}>{description}</span>}

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
