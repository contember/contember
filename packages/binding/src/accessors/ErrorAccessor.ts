class ErrorAccessor {
	public constructor(public readonly validation: ErrorAccessor.ValidationError[]) {}
}
namespace ErrorAccessor {
	export interface ValidationError {
		message: string
	}
}
export { ErrorAccessor }
