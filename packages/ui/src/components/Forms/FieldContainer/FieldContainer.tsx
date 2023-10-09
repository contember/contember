import { useClassNameFactory, useColorScheme, useElementSize } from '@contember/react-utils'
import { ComponentClassNameProps, colorSchemeClassName, controlsThemeClassName, dataAttribute, deprecate, fallback, omit, px, themeClassName } from '@contember/utilities'
import { CSSProperties, ReactNode, memo, useMemo, useRef } from 'react'
import type { Size } from '../../../types'
import { ErrorList, ErrorListProps } from '../../ErrorList/ErrorList'
import { Stack, StackProps } from '../../Stack'
import { Description, Label } from '../../Typography'
import type { FieldContainerLabelPosition } from './Types'


export interface FieldContainerOwnProps extends ComponentClassNameProps {
	/**
	 * Usually an input or a group of inputs
	 */
	children: ReactNode
	/**
	 * Usually displayed below the input, provides additional information, e.g. about the input's purpose or expected format
	 */
	description?: ReactNode
	/**
	 * Stack prop that directs children to be sized evenly
	 */
	evenly?: StackProps['evenly']
	/**
	 * Stack prop that sets the gap between children
	 */
	gap?: StackProps['gap']
	/**
	 * Sets display of the container to inline or block.
	 *
	 * Setting affects header sizing when displayed horizontally.
	 * Inline container will have its header sized to the size of the label.
	 * Block container header will keep a relative size to the input.
	 *
	 * Note that the field container uses flexbox, so the `inline` will result in `display: inline-flex`
	 * and `block` will result in `display: flex` respectively.
	 */
	display?: 'inline' | 'block'
	/**
	 * Additional content to be displayed below the input, description and error list, e.g. a button to add more repeater items.
	 */
	footer?: ReactNode
	/**
	 * Stack prop that sets the direction of children to be horizontal
	 */
	horizontal?: StackProps['horizontal']
	/**
	 * Label of the field, usually displayed above the input.
	 */
	label: ReactNode
	/**
	 * Expands on the label e.g. to provide the additional explanation
	 */
	labelDescription?: ReactNode
	/**
	 * Position of the label relative to the input, by default the label is displayed above the input.
	 * Other options are `left`,`right`, `top` and `bottom`.
	 */
	labelPosition?: FieldContainerLabelPosition
	/**
	 * Displays an asterisk next to the label to indicate that the field is required
	 */
	required?: boolean
	/**
	 * Size of the label.
	 */
	size?: Size
	/**
	 * Use `<label>` element instead of `<div>` for the label, which is useful for accessibility, by default a `<label>` is used.
	 */
	useLabelElement?: boolean
	/**
	 * Stack prop that reverses the order of children
	 */
	reverse?: StackProps['reverse']
	style?: CSSProperties
}

/** @deprecated Use `FieldContainerOwnProps` instead */
export interface DeprecatedFieldContainerProps {
	/** @deprecated Use combination of `horizontal` and `reverse` props instead */
	direction?: StackProps['direction']
	/** @deprecated No alternative */
	width?: 'column' | 'fluid' | 'none'
}

export interface FieldContainerProps extends
	ErrorListProps,
	DeprecatedFieldContainerProps,
	FieldContainerOwnProps {
}

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
		className: classNameProp,
		componentClassName = 'field-container',
		description,
		errors,
		direction,
		display = 'block',
		footer,
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
		...props
	}: FieldContainerProps) => {
		deprecate('1.3.0', labelPosition === 'labelInlineLeft', '`labelPosition="labelInlineLeft"`', '`labelPosition="left" display="inline"`')
		deprecate('1.3.0', labelPosition === 'labelInlineRight', '`labelPosition="labelInlineRight"`', '`labelPosition="right" display="inline"`')
		deprecate('1.3.0', labelPosition === 'labelLeft', '`labelPosition="labelLeft"`', '`labelPosition="left"`')
		deprecate('1.3.0', labelPosition === 'labelRight', '`labelPosition="labelRight"`', '`labelPosition="right"`')

		display = fallback(display, labelPosition === 'labelInlineLeft' || labelPosition === 'labelInlineRight', 'inline')
		labelPosition = fallback(labelPosition, labelPosition === 'labelInlineLeft' || labelPosition === 'labelLeft', 'left')
		labelPosition = fallback(labelPosition, labelPosition === 'labelInlineRight' || labelPosition === 'labelRight', 'right')

		const LabelElement = useLabelElement ? 'label' : 'div'
		const className = useClassNameFactory(componentClassName)

		const invalid = !!errors?.length

		const asteriskClassName = [...themeClassName('danger'), colorSchemeClassName(useColorScheme())]
		const bodyContentRef = useRef<HTMLDivElement>(null)
		const { height } = useElementSize(bodyContentRef)

		const rest = omit(props as Record<PropertyKey, unknown>, unfilteredBindingRestProps)

		return (
			<LabelElement
				{...rest}
				data-invalid={dataAttribute(invalid)}
				data-size={dataAttribute(size)}
				data-label-position={dataAttribute(labelPosition)}
				data-display={dataAttribute(display)}
				className={className(null, [
					invalid ? controlsThemeClassName('danger') : null,
					colorSchemeClassName(useColorScheme()),
					classNameProp,
				])}
				style={useMemo(() => labelPosition === 'left' || labelPosition === 'right'
					? ({
						'--cui-field-container--body-content-height': px(height),
						...style,
					})
					: style, [height, labelPosition, style])}
			>
				{(label || labelDescription) && (
					<span className={className('header')}>
						{label && <Label>
							{label}
							{required && <span className={className('required-asterisk', asteriskClassName)}>*</span>}
						</Label>}
						{labelDescription && <Description>{labelDescription}</Description>}
					</span>
				)}
				{(children || description) && (
					<div className={className('body')}>
						{children && (
							<Stack
								ref={bodyContentRef}
								className={className('body-content')}
								direction={direction}
								horizontal={horizontal}
								evenly={evenly}
								reverse={reverse}
								gap={gap}
							>
								{children}
							</Stack>
						)}
						{description && <span className={className('body-content-description')}>{description}</span>}
						{!!errors && errors.length > 0 && (
							<div className={className('errors')}>
								<ErrorList errors={errors} />
							</div>
						)}
					</div>
				)}
				{footer && <div className={className('footer')}>{footer}</div>}
			</LabelElement>
		)
	},
)
FieldContainer.displayName = 'FieldContainer'

const unfilteredBindingRestProps = [
	'connectingEntityField',
	'containerComponentExtraProps',
	'createNewForm',
	'currentValue',
	'enableRemoving',
	'initialEntityCount',
	'itemComponent',
	'itemComponentExtraProps',
	'lazy',
	'onClear',
	'onSearch',
	'optionLabel',
	'orderBy',
	'removalType',
	'searchByFields',
	'sortableBy',
]
