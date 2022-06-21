import { FilePreview } from '@contember/ui'
import { FullFileKind } from '../../fileKinds'

export interface UploadedFilePreviewProps {
	fileKind: FullFileKind
}

export function UploadedFilePreview({ fileKind }: UploadedFilePreviewProps) {
	return <FilePreview>{fileKind.renderUploadedFile}</FilePreview>
}
