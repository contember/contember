import { ReactNode } from 'react'

export interface SingleFileUploadProps {
	renderFile?: () => ReactNode
	renderFilePreview?: (file: File, previewUrl: string) => ReactNode
}
