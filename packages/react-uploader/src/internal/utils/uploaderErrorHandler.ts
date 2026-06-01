import { ErrorEvent } from '../../types/index.js'
import { UploaderError } from '../../UploaderError.js'

export const uploaderErrorHandler = (event: ErrorEvent) => {
	if (event.error instanceof UploaderError && (event.error.options.type === 'fileRejected' || event.error.options.type === 'aborted')) {
		return
	}
	console.error('Upload error', event.error)
}
