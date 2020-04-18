import { FilePreview } from '@contember/ui'
import * as React from 'react'

export interface UploadedFilePreviewProps {
	renderFile?: () => React.ReactNode
}

export const UploadedFilePreview = React.memo(({ renderFile }: UploadedFilePreviewProps) => {
	return <FilePreview>{renderFile?.()}</FilePreview> // TODO render file default
})
UploadedFilePreview.displayName = 'UploadedFilePreview'
