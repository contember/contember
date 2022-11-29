import { SchemaValidator, SchemaValidatorSkippedErrors, ValidationError } from '@contember/schema-utils'
import { Schema } from '@contember/schema'

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

export const validateSchemaAndPrintErrors = (schema: Schema, message?: string, skippedErrors?: SchemaValidatorSkippedErrors[]): boolean => {
	const errors = SchemaValidator.validate(schema, skippedErrors)
	printValidationErrors(errors, message)
	return errors.length === 0
}
