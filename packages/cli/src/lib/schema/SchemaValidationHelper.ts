import { Schema } from '@contember/schema'
import { SchemaValidator, SchemaValidatorSkippedErrors } from '@contember/schema-utils'
import { printValidationErrors } from './SchemaValidationPrinter'

export const validateSchemaAndPrintErrors = (schema: Schema, message?: string, skippedErrors?: SchemaValidatorSkippedErrors[]): boolean => {
	const errors = SchemaValidator.validate(schema, skippedErrors)
	printValidationErrors(errors, message)
	return errors.length === 0
}
