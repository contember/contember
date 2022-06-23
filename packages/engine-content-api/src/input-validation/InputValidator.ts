import { ValidationPath } from './ValidationPath.js'
import { Validation } from '@contember/schema'

export interface FieldValidationResult {
	path: ValidationPath
	message: Validation.Message
}

export type ValidationResult = FieldValidationResult[]
