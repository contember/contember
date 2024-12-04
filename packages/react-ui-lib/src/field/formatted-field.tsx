import { Component, FieldView, SugaredRelativeSingleField } from '@contember/interface'
import { getFormatter } from '../formatting'

export interface FormattedFieldProps {
	field: SugaredRelativeSingleField['field']
}

export const FormattedField = Component<FormattedFieldProps>(({ field }) => {
	return <FieldView field={field} render={it => getFormatter(it.schema)(it.value)} />
})
