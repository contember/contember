import { attrAccept } from './attrAccept.js'
import { FileType, FileWithMeta } from '../../types/index.js'

export const resolveAcceptingSingleType = async (
	file: FileWithMeta,
	fileType: FileType,
) => {
	const acceptMimeTypes = fileType.accept
	if (acceptMimeTypes && !attrAccept(file.file, Object.keys(acceptMimeTypes))) {
		return undefined
	}

	const isFileAccepted = fileType.acceptFile === undefined ? true : await fileType.acceptFile(file)
	if (!isFileAccepted) {
		return undefined
	}

	return isFileAccepted
}
