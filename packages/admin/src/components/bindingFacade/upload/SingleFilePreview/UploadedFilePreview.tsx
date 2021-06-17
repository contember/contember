import { FilePreview } from '@contember/ui'
import type { FullFileKind } from '../interfaces'

export interface UploadedFilePreviewProps {
	fileKind: FullFileKind
}

export function UploadedFilePreview({ fileKind }: UploadedFilePreviewProps) {
	return <FilePreview>{fileKind.renderUploadedFile}</FilePreview>
}
