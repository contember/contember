import { BindingError } from '@contember/binding'
import type { ReactElement } from 'react'
import type { DiscriminatedFileKind } from './interfaces'

export interface FileKindProps<UploadResult = unknown, AcceptArtifacts = unknown, FileData = unknown>
	extends DiscriminatedFileKind<UploadResult, AcceptArtifacts, FileData> {}

export function FileKind<UploadResult = unknown, AcceptArtifacts = unknown, FileData = unknown>(
	props: FileKindProps<UploadResult, AcceptArtifacts, FileData>,
): ReactElement | null {
	throw new BindingError(`Cannot render FileKind outside a supporting upload component!`)
}
