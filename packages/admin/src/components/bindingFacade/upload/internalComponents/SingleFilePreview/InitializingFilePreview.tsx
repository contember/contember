import { FilePreview, UploadProgress } from '@contember/ui'
import type { MessageFormatter } from '../../../../../i18n'
import type { UploadDictionary } from '../../uploadDictionary'

export interface InitializingFilePreviewProps {
	formatMessage: MessageFormatter<UploadDictionary>
}
export function InitializingFilePreview({ formatMessage }: InitializingFilePreviewProps) {
	return <FilePreview overlay={<UploadProgress progress={formatMessage('upload.fileState.inspectingFile')} />} />
}
