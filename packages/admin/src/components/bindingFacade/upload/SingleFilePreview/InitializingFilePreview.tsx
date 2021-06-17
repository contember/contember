import { FilePreview, UploadProgress } from '@contember/ui'

export interface InitializingFilePreviewProps {}
export function InitializingFilePreview(props: InitializingFilePreviewProps) {
	return <FilePreview overlay={<UploadProgress progress="Inspecting file" />} />
}
