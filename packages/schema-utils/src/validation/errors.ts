export interface ValidationError {
	path: (string | number)[]
	message: string
}

export class ErrorBuilder {
	constructor(public readonly errors: ValidationError[], private readonly path: string[] = []) {}

	for(...path: string[]): ErrorBuilder {
		return new ErrorBuilder(this.errors, [...this.path, ...path])
	}

	add(message: string): void {
		this.errors.push({ path: this.path, message })
	}
}
