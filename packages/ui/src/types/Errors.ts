export interface FieldError {
	message: string
}

export type FieldErrors =
	| FieldError[]
	| {
			validation: [FieldError, ...FieldError[]] | undefined
	  }
