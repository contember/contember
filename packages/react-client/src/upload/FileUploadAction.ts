import type { FileUploadProgress } from '@contember/client'
import type { FileId } from './FileId'
import type { FileWithMetadata } from './FileWithMetadata'

export type FileUploadAction =
	| {
			type: 'publishNewestState'
	  }
	| {
			type: 'startUploading'
			files: Iterable<[[FileId, File] | File, FileWithMetadata]>
	  }
	| {
			type: 'updateUploadProgress'
			progress: Iterable<[File | FileId, FileUploadProgress]>
	  }
	| {
			type: 'finishSuccessfully'
			result: Iterable<[File | FileId, any]>
	  }
	| {
			type: 'finishWithError'
			error: Iterable<(File | FileId) | [File | FileId, any]>
	  }
	| {
			type: 'abort'
			files: Iterable<File | FileId>
	  }
