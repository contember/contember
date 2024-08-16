import { ErrorEvent } from '../../types'
import { UploaderError } from '../../UploaderError'

export const uploaderErrorHandler = (event: ErrorEvent) => {
	if (event.error instanceof UploaderError && (event.error.options.type === 'fileRejected' || event.error.options.type === 'aborted')) {
		return
	}
	console.error('Upload error', event.error)
}
