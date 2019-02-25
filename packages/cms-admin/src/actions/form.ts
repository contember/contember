import { createAction } from 'redux-actions'
import { FORM_SET_DIRTINESS } from '../reducer/form'
import { FormDirtinessDelta, FormDirtinessState, FormId } from '../state/form'

export const setFormDirtiness = (formId: FormId, isDirty: FormDirtinessState) =>
	createAction<FormDirtinessDelta>(FORM_SET_DIRTINESS, () => {
		return {
			formId,
			isDirty
		}
	})()
