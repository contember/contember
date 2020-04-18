import * as React from 'react'

export interface SingleFileUploadProps {
	renderFile?: () => React.ReactNode
	renderFilePreview?: (file: File, previewUrl: string) => React.ReactNode
}
