import { ErrorPersistResult, SuccessfulPersistResult } from './PersistResult.js'

export type DataBindingEventListenerMap = {
	persistSuccess: (result: SuccessfulPersistResult) => void | Promise<void>
	persistError: (result: ErrorPersistResult) => void | Promise<void>
}
