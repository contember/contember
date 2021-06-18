import { BindingError } from '@contember/binding'
import type { ReactElement } from 'react'
import type { DiscriminatedFileKind } from './interfaces'

export interface FileKindProps<UploadResult = unknown, AcceptArtifacts = unknown>
	extends DiscriminatedFileKind<UploadResult, AcceptArtifacts> {}

export function FileKind<UploadResult = unknown, AcceptArtifacts = unknown>(
	props: FileKindProps<UploadResult, AcceptArtifacts>,
): ReactElement | null {
	throw new BindingError(`Cannot render FileKind outside a supporting upload component!`)
}
