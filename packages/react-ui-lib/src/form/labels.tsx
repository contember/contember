import { useFormFieldState } from '@contember/react-form'
import { useFieldLabelFormatter } from '../labels'

export const FormFieldLabel = () => {
	const state = useFormFieldState()
	const fieldLabelFormatter = useFieldLabelFormatter()
	return state?.field ? fieldLabelFormatter(state.field.entityName, state.field.fieldName) : undefined
}
