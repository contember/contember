import { ErrorAccessor } from './ErrorAccessor'

export interface Errorable {
	errors: ErrorAccessor | undefined
}
