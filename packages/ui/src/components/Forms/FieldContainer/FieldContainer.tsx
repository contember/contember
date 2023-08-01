import { useClassNameFactory, useColorScheme, useElementSize } from '@contember/react-utils'
import { colorSchemeClassName, controlsThemeClassName, dataAttribute, deprecate, fallback, px, themeClassName } from '@contember/utilities'
import { CSSProperties, ReactNode, memo, useMemo, useRef } from 'react'
import type { Size } from '../../../types'
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
		display?: 'inline' | 'block'
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
 * 	display="inline"
 * 	label="Lorem ipsum"
 * 	labelPosition="left"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	display="inline"
 * 	labelPosition="right"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="left"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="right"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 *
 * <FieldContainer
 * 	labelPosition="bottom"
 * 	label="Lorem ipsum"
 * 	labelDescription="Lorem ipsum dolor"
 * 	description="Lorem ipsum dolor sit amet"
 * >
 * 	<TextInput name="name" placeholder="Enter name..." />
 * </FieldContainer>
 * ```
 *
 * @group Forms UI
 */
export const FieldContainer = memo(
	({
		children,
		className,
		description,
		errors,
		direction,
		display = 'block',
		evenly,
		gap = 'gap',
		horizontal = false,
		label,
		labelDescription,
		labelPosition = 'top',
		required,
		reverse,
		size,
		style,
		useLabelElement = true,
		width = 'column',
	}: FieldContainerProps) => {
		deprecate('1.3.0', labelPosition === 'labelInlineLeft', '`labelPosition="labelInlineLeft"`', '`labelPosition="left" display="inline"`')
		deprecate('1.3.0', labelPosition === 'labelInlineRight', '`labelPosition="labelInlineRight"`', '`labelPosition="right" display="inline"`')
		deprecate('1.3.0', labelPosition === 'labelLeft', '`labelPosition="labelLeft"`', '`labelPosition="left"`')
		deprecate('1.3.0', labelPosition === 'labelRight', '`labelPosition="labelRight"`', '`labelPosition="right"`')

		display = fallback(display, labelPosition === 'labelInlineLeft' || labelPosition === 'labelInlineRight', 'inline')
		labelPosition = fallback(labelPosition, labelPosition === 'labelInlineLeft' || labelPosition === 'labelLeft', 'left')
		labelPosition = fallback(labelPosition, labelPosition === 'labelInlineRight' || labelPosition === 'labelRight', 'right')

		const LabelElement = useLabelElement ? 'label' : 'div'
		const componentClassName = useClassNameFactory('field-container')

		const invalid = !!errors?.length

		const asteriskClassName = [...themeClassName('danger'), colorSchemeClassName(useColorScheme())]
		const bodyContentRef = useRef<HTMLDivElement>(null)
		const { height } = useElementSize(bodyContentRef)

		return (
			<div
				data-invalid={dataAttribute(invalid)}
				data-size={dataAttribute(size)}
				data-label-position={dataAttribute(labelPosition)}
				data-display={dataAttribute(display)}
				className={componentClassName(null, [
					invalid ? controlsThemeClassName('danger') : null,
					colorSchemeClassName(useColorScheme()),
					className,
				])}
				style={useMemo(() => ({
					'--cui-field-container--body-content-height': px(height),
					...style,
				}), [height, style])}
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
					{(children || description) && <div className={componentClassName('body')}>
						{children && (
							<Stack
								ref={bodyContentRef}
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
						{description && <span className={componentClassName('body-content-description')}>{description}</span>}
						{!!errors && errors.length > 0 && (
							<div className={componentClassName('errors')}>
								<ErrorList errors={errors} />
							</div>
						)}
					</div>}
				</LabelElement>
			</div>
		)
	},
)
FieldContainer.displayName = 'FieldContainer'
