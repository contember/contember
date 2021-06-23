import { BindingError } from '@contember/binding'
import attrAccept from 'attr-accept'
import { AcceptFileKindError } from '../interfaces'
import type { AcceptFileOptions, FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { eachFileKind } from './eachFileKind'

export interface ResolvedAcceptingFileKind<AcceptArtifacts = any> {
	acceptOptions: AcceptFileOptions
	fileKind: FullFileKind<any, AcceptArtifacts>
	acceptArtifacts: AcceptArtifacts
}

export const resolveAcceptingFileKind = async (
	fileOptions: AcceptFileOptions,
	fileKinds: ResolvedFileKinds,
): Promise<ResolvedAcceptingFileKind> => {
	const errors: AcceptFileKindError[] = []

	for (const fileKind of eachFileKind(fileKinds)) {
		const acceptMimeTypes = fileKind.acceptMimeTypes
		if (
			acceptMimeTypes !== null &&
			acceptMimeTypes !== '*' &&
			acceptMimeTypes !== '*/*' &&
			!attrAccept(fileOptions.file, acceptMimeTypes)
		) {
			continue
		}

		try {
			const isFileAccepted = fileKind.acceptFile === undefined ? true : fileKind.acceptFile(fileOptions)

			if (isFileAccepted === true) {
				return {
					fileKind,
					acceptOptions: fileOptions,
					acceptArtifacts: undefined,
				}
			} else if (isFileAccepted === false) {
				continue
			} else if (isFileAccepted instanceof Promise) {
				return {
					fileKind,
					acceptOptions: fileOptions,
					acceptArtifacts: await isFileAccepted,
				}
			}
		} catch (e) {
			if (e instanceof AcceptFileKindError) {
				errors.push(e)
			}
			continue
		}
		throw new BindingError('File upload: illegal acceptFile return value. Boolean or Promise expected.')
	}
	throw new AggregateError(errors)
}
