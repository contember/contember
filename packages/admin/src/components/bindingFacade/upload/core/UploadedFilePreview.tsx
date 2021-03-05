import { FilePreview } from '@contember/ui'
import { memo, ReactNode } from 'react'

export interface UploadedFilePreviewProps {
	renderFile: undefined | (() => ReactNode)
}

export const UploadedFilePreview = memo(({ renderFile }: UploadedFilePreviewProps) => {
	return <FilePreview>{renderFile?.()}</FilePreview> // TODO render file default
})
UploadedFilePreview.displayName = 'UploadedFilePreview'
