import { FileDataExtractor } from './extractor'
import { SugaredRelativeSingleEntity } from '@contember/react-binding'
import { FileWithMeta } from './file'
import { UploadClient } from '../uploadClient/UploadClient'

export interface FileType {

	/**
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker#accept
	 * null means "any mime type"
	 */
	accept?: Record<string, string[]> | undefined

	/** Optionally reject with {@link RejectFileError}. */
	acceptFile?: ((file: FileWithMeta) => boolean | Promise<void>) | undefined
	extractors?: FileDataExtractor[]
	uploader?: UploadClient<any>
}


export type DiscriminatedFileType =
	& FileType
	& {
		baseField?: SugaredRelativeSingleEntity['field']
	}

export type DiscriminatedFileTypeMap = Record<string, DiscriminatedFileType>
