import { ValidationError } from '@contember/schema-utils'


export const printValidationErrors = (errors: ValidationError[], message?: string) => {
	if (errors.length === 0) {
		return
	}
	console.group(message || 'Schema is invalid:')
	for (const err of errors) {
		console.log(`${err.path.join('.')}: [${err.code}] ${err.message}`)
	}
	console.groupEnd()
}
