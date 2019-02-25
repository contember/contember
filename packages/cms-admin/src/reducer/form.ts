import { Reducer } from 'redux'
import { Action, handleActions } from 'redux-actions'
import { emptyFormState, FormDirtinessDelta, FormState } from '../state/form'

export const FORM_SET_DIRTINESS = 'form_set_dirtiness'

export default handleActions<FormState, any>(
	{
		[FORM_SET_DIRTINESS]: (state, action: Action<FormDirtinessDelta>): FormState => {
			if (action.payload === undefined) {
				throw new Error('Action payload can not be undefined')
			}
			return { ...state, dirty: { ...state.dirty, [action.payload.formId]: action.payload.isDirty } }
		}
	},
	emptyFormState
) as Reducer
