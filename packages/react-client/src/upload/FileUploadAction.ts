import type { FileUploadProgress } from '@contember/client'
import type { FileId } from './FileId'
import type { FileUploadMetadata } from './FileUploadMetadata'
import type { FileWithMetadata } from './FileWithMetadata'

export type FileUploadAction<Result = unknown, Metadata = undefined> =
	| {
			type: 'initialize'
			files: Iterable<[FileId, FileWithMetadata]>
	  }
	| {
			type: 'startUploading'
			files: Iterable<[File | FileId, FileUploadMetadata<Metadata>]>
	  }
	| {
			type: 'updateUploadProgress'
			progress: Iterable<[File | FileId, FileUploadProgress]>
	  }
	| {
			type: 'finishSuccessfully'
			result: Iterable<[File | FileId, Result]>
	  }
	| {
			type: 'finishWithError'
			error: Iterable<(File | FileId) | [File | FileId, any]>
	  }
	| {
			type: 'purge'
			files: Iterable<File | FileId>
	  }
