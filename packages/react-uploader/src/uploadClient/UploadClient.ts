export interface UploadClient<
	Options, // contains file-specific options
	Result extends FileUploadResult = FileUploadResult,
> {
	upload: (args: UploadClientUploadArgs & Omit<Options, keyof UploadClientUploadArgs>) => Promise<Result>
}

export interface FileUploadResult {
	publicUrl: string
}

export interface FileUploadProgress {
	progress: number
	uploadedBytes: number
	totalBytes: number
}

export interface UploadClientUploadArgs {
	file: File
	signal: AbortSignal
	onProgress: (progress: FileUploadProgress) => void
}
