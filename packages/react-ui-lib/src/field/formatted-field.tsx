import { Component, FieldView, SugaredRelativeSingleField } from '@contember/interface'
import { getFormatter } from '../formatting'

export interface FormattedFieldProps {
	field: SugaredRelativeSingleField['field']
}

/**
 * FormattedField component - Displays formatted field values based on schema configuration
 *
 * #### Purpose
 * Automatically formats and displays field values using type-specific formatters defined in the schema
 *
 * #### Requirements
 * - Must be used within an Entity context (`<EntitySubTree />` or `<EntityListSubTree />`).
 *
 * #### Features
 * - Automatic value formatting based on field type
 * - Pure presentational component (read-only)
 * - Handles null/undefined values gracefully
 *
 * #### Example
 * ```tsx
 * <FormattedField field="publishedAt" />
 * ```
 *
 * #### Note
 * The actual formatting is controlled by schema configuration, not component props
 */
export const FormattedField = Component<FormattedFieldProps>(({ field }) => {
	return <FieldView field={field} render={it => getFormatter(it.schema)(it.value)} />
})
