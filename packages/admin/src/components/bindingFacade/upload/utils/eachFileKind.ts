import type { FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'

export function* eachFileKind(fileKinds: ResolvedFileKinds): Generator<FullFileKind> {
	if (fileKinds.isDiscriminated) {
		for (const fileKind of fileKinds.fileKinds.values()) {
			yield fileKind.datum
		}
	} else {
		yield fileKinds.fileKind
	}
}
