import { Component, FieldView, SugaredRelativeSingleField } from '@contember/interface'
import { getFormatter } from '../formatting/index.js'

/**
 * Props for the {@link FormattedField} component.
 */
export interface FormattedFieldProps {
	/**
	 * The field to render.
	 */
	field: SugaredRelativeSingleField['field']
}

/**
 * `FormattedField` is a wrapper around {@link FieldView} that applies a formatter to the field's value
 * based on its schema definition.
 *
 * ## Example: Rendering a formatted field
 * ```tsx
 * <FormattedField field={myField} />
 * ```
 */
export const FormattedField = Component<FormattedFieldProps>(({ field }) => {
	return <FieldView field={field} render={it => getFormatter(it.schema)(it.value)} />
})
