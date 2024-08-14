import { ErrorAccessor } from '@contember/binding-common'

export class ErrorSet {
	#errors = new Set<ErrorAccessor.Error>()

	public addError(error: ErrorAccessor.Error): ErrorAccessor.ClearError {
		this.#errors.add(error)
		return () => {
			this.#errors.delete(error)
		}
	}

	public clearErrors(): void {
		this.#errors.clear()
	}

	get errors(): ErrorAccessor | undefined {
		if (this.#errors.size === 0) {
			return undefined
		}
		return { errors: Array.from(this.#errors) }
	}
}
