import { Schema } from '@contember/schema'
import { SchemaValidator, SchemaValidatorSkippedErrors } from '@contember/schema-utils'
import { Output } from '@contember/cli-common'
import { printValidationErrors } from './SchemaValidationPrinter.js'

export const validateSchemaAndPrintErrors = (
	schema: Schema,
	message?: string,
	skippedErrors?: SchemaValidatorSkippedErrors[],
	output?: Output,
): boolean => {
	const errors = SchemaValidator.validate(schema, skippedErrors)
	printValidationErrors(errors, message, output)
	return errors.length === 0
}
