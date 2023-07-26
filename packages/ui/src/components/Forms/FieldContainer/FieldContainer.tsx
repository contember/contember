import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, controlsThemeClassName, themeClassName } from '@contember/utilities'
import { CSSProperties, ReactNode, memo } from 'react'
import type { Size } from '../../../types'
import { toEnumClass, toEnumViewClass } from '../../../utils'
import { ErrorList, ErrorListProps } from '../../ErrorList/ErrorList'
import { Stack, StackProps } from '../../Stack'
import { Description, Label } from '../../Typography'
import type { FieldContainerLabelPosition } from './Types'

export type FieldContainerProps =
	& {
		children: ReactNode // The actual field
		description?: ReactNode // Can explain e.g. the kinds of values to be filled
		/** @deprecated Use `horizontal` instead */
		direction?: StackProps['direction']
		evenly?: StackProps['evenly']
		gap?: StackProps['gap']
		horizontal?: StackProps['horizontal']
		label: ReactNode
		labelDescription?: ReactNode // Expands on the label e.g. to provide the additional explanation
		labelPosition?: FieldContainerLabelPosition
		/** @deprecated No alternative */
		width?: 'column' | 'fluid' | 'none'
		required?: boolean
		size?: Size
		useLabelElement?: boolean
		reverse?: StackProps['reverse']
		style?: CSSProperties
		className?: string
	}
	& ErrorListProps

/**
 * The `FieldContainer` component is a container that can be used to wrap inputs to form a labeled field.
 *
 * @example
 * A basic FieldContainer:
 * ```tsx
 * <FieldContainer label="Lorem ipsum">
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 * ```
 *
 * @example
 * FieldContainer with various label positions:
 * ```tsx
 * <FieldContainer
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="labelInlineLeft"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="labelInlineRight"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="labelLeft"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="labelRight"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 * @group Forms UI
 */
export const FieldContainer = memo(
	({
		children,
		className,
		description,
		errors,
		direction,
		evenly,
		gap = 'gap',
		horizontal = false,
		label,
		labelDescription,
		labelPosition,
		required,
		reverse,
		size,
		style,
		useLabelElement = true,
		width = 'column',
	}: FieldContainerProps) => {
		const LabelElement = useLabelElement ? 'label' : 'div'
		const componentClassName = useClassNameFactory('field-container')

		const isLabelInline = labelPosition === 'labelInlineLeft' || labelPosition === 'labelInlineRight'
		const invalid = !!errors?.length

		const asteriskClassName = [...themeClassName('danger'), colorSchemeClassName(useColorScheme())]

		return (
			<div
				data-invalid={invalid ? true : undefined}
				style={style}
				className={componentClassName(null, [
					toEnumViewClass(size),
					toEnumViewClass(labelPosition),
					invalid ? controlsThemeClassName('danger') : null,
					colorSchemeClassName(useColorScheme()),
					className,
				])}
			>
				<LabelElement className={componentClassName('label')}>
					{(label || labelDescription) && <span className={componentClassName('header')}>
						{label && <Label>
							{label}
							<span className={componentClassName('required-asterisk', asteriskClassName)}>{required && '*'}</span>
						</Label>}
						{labelDescription && <Description>{labelDescription}</Description>}
					</span>
					}
					{(children || (!isLabelInline && description)) && <div className={componentClassName('body')}>
						{children && (
							<Stack
								className={componentClassName('body-content')}
								direction={direction}
								horizontal={horizontal}
								evenly={evenly}
								reverse={reverse}
								gap={gap}
							>
								{children}
							</Stack>
						)}
						{!isLabelInline && description && <span className={componentClassName('body-content-description')}>{description}</span>}
					</div>}
				</LabelElement>
				{isLabelInline && description && <span className={componentClassName('body-content-description')}>{description}</span>}

				{!!errors && errors.length > 0 && (
					<div className={componentClassName('errors')}>
						<ErrorList errors={errors} />
					</div>
				)}
			</div>
		)
	},
)
FieldContainer.displayName = 'FieldContainer'
