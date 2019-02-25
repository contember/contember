export type FormId = string

export type FormDirtinessState = boolean

export interface FormDirtinessDelta {
	formId: FormId
	isDirty: FormDirtinessState
}

export interface FormState {
	dirty: {
		[id: string]: FormDirtinessState
	}
}

export const emptyFormState: FormState = {
	dirty: {}
}
