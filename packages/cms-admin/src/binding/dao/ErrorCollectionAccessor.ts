import { ErrorAccessor } from './ErrorAccessor'

class ErrorCollectionAccessor extends Array<ErrorAccessor> {
	public constructor(errors: string[] = []) {
		super(...errors.map(error => new ErrorAccessor(error)))
	}
}

export { ErrorCollectionAccessor }
