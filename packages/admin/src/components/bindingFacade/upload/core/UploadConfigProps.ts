import type { FileUploader } from '@contember/client'

export interface UploadConfigProps {
	accept?: string | string[]
	uploader?: FileUploader
}
