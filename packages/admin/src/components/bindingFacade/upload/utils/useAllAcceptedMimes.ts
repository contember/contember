import { useMemo } from 'react'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { eachFileKind } from './eachFileKind'

export const useAllAcceptedMimes = (fileKinds: ResolvedFileKinds): string | string[] | undefined => {
	return useMemo<string | string[] | undefined>(() => {
		const desugarMime = (mime: string): string | undefined => {
			if (mime === '*') {
				// This technically allows invalid mimes but it's such a common mistake that we just go for it to
				// save people from shooting themselves in the foot.
				return undefined
			}
			return mime
		}
		const mimes = new Set<string>()

		for (const { acceptMimeTypes } of eachFileKind(fileKinds)) {
			if (acceptMimeTypes === null) {
				return undefined
			}
			if (Array.isArray(acceptMimeTypes)) {
				for (const mime of acceptMimeTypes) {
					const desugared = desugarMime(mime)
					if (desugared) {
						mimes.add(desugared)
					}
				}
			} else {
				const desugared = desugarMime(acceptMimeTypes)
				if (desugared) {
					mimes.add(desugared)
				}
			}
		}
		return Array.from(mimes)
	}, [fileKinds])
}
