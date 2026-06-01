import type { ErrorAccessor } from './ErrorAccessor.js'

export interface Errorable {
	errors: ErrorAccessor | undefined
}
