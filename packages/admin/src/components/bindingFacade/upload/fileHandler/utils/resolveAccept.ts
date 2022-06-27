import { attrAccept } from './attrAccept'
import { AcceptFileOptions, FullFileKind } from '../../fileKinds'

export const resolveAcceptingSingleKind = async (
	fileOptions: AcceptFileOptions,
	fileKind: FullFileKind<any, any>,
) => {
	const acceptMimeTypes = fileKind.acceptMimeTypes
	if (!attrAccept(fileOptions.file, acceptMimeTypes)) {
		return undefined
	}

	const isFileAccepted = fileKind.acceptFile === undefined ? true : await fileKind.acceptFile(fileOptions)
	if (!isFileAccepted) {
		return undefined
	}
	return isFileAccepted
}
