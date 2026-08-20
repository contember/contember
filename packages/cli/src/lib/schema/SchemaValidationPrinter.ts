import { Output } from '@contember/cli-common'
import { ValidationError } from '@contember/schema-utils'

// diagnostic only — never the command's own data output; callers that don't yet pass `output` fall back to a fresh one
export const printValidationErrors = (errors: ValidationError[], message?: string, output: Output = new Output()) => {
	if (errors.length === 0) {
		return
	}
	output.error(message || 'Schema is invalid:')
	for (const err of errors) {
		output.error(`  ${err.path.join('.')}: [${err.code}] ${err.message}`)
	}
}
