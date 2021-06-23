export interface FileUploadErrorOptions {
	developerMessage?: string
	endUserMessage?: string
}

export class FileUploadError extends Error {
	public constructor(public readonly options: FileUploadErrorOptions = {}) {
		super(options.developerMessage)
	}
}
