import { assertNever, Input, Model, Result } from 'cms-common'
import InputValidator from '../input-validation/InputValidator'

export default class ValidationResolver {
	constructor(private readonly inputValidator: InputValidator) {}

	public async validateUpdate(entity: Model.Entity, input: Input.UpdateInput): Promise<Result.ValidationResult> {
		const validationResult = await this.inputValidator.validateUpdate(entity, input.by, input.data)
		if (validationResult.length > 0) {
			return ValidationResolver.createValidationResponse(validationResult)
		}
		return {
			valid: true,
			errors: [],
		}
	}

	public async validateCreate(entity: Model.Entity, input: Input.CreateInput): Promise<Result.ValidationResult> {
		const validationResult = await this.inputValidator.validateCreate(entity, input.data)
		if (validationResult.length > 0) {
			return ValidationResolver.createValidationResponse(validationResult)
		}
		return {
			valid: true,
			errors: [],
		}
	}

	public static createValidationResponse(validationResult: InputValidator.Result): Result.ValidationResult {
		return {
			valid: false,
			errors: validationResult.map(it => ({
				message: it.message,
				path: it.path.map(part => {
					switch (typeof part) {
						case 'number':
							return { __typename: '_IndexPathFragment', index: part }
						case 'string':
							return { __typename: '_FieldPathFragment', field: part }
						default:
							return assertNever(part)
					}
				}),
			})),
		}
	}
}
