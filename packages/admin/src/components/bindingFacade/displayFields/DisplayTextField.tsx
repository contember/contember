import { NonOptionalUseInputClassNameProps, VisuallyDependentControlProps, useInputClassName } from '@contember/ui'
import { SimpleRelativeSingleField, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { FieldValueFormatter } from '../fields/useFieldControl'

export type DisplayTextFieldProps =
	& Omit<SimpleRelativeSingleFieldProps, 'defaultValue'>
	& VisuallyDependentControlProps
	& {
		format?: FieldValueFormatter<string, string>;
	}

export const DisplayTextField = SimpleRelativeSingleField<DisplayTextFieldProps, string>(
	(fieldMetadata, {
		field: fieldName,
		// ControlStateProps:
		active, disabled, loading, readOnly, required, focused, hovered,
		// ControlDisplayProps:
		className: outerClassName, distinction, intent, scheme, size,
		// ValidationStateProps:
		validationState,
		// Rest:
		errors,
		format,
		id,
		name,
		placeholder,
		style,
		type,
		...props
	}) => {
		if (import.meta.env.DEV) {
			const exhaustiveCheck: Record<string, never> = props
		}

		const field = fieldMetadata.field
		const value = format?.(field.value, field) ?? field.value

		const className = useInputClassName<NonOptionalUseInputClassNameProps>({
			active, disabled, loading, readOnly, required, focused, hovered,
			className: outerClassName, distinction, intent, scheme, size,
			validationState,
		})

		return (
			<div
				data-id={id}
				data-invalid={!!(errors?.length)}
				data-name={name}
				data-placeholder={placeholder}
				data-field={fieldName}
				data-type={type}
				data-value={value}
				data-is-empty={`${!value}`}
				className={className || undefined}
				style={style}
				{...props}
			>
				{value ?? placeholder}
			</div>
		)
	},
	'DisplayTextField',
	{ suppressErrors: true },
)
