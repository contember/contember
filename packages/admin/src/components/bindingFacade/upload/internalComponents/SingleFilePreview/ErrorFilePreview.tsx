import type { SingleFileUploadState } from '@contember/react-client'
import { ErrorList, FilePreview, Message } from '@contember/ui'
import type { MessageFormatter } from '../../../../../i18n'
import type { UploadDictionary } from '../../uploadDictionary'

export interface ErrorFilePreviewProps {
	uploadState: SingleFileUploadState & { readyState: 'error' }
	formatMessage: MessageFormatter<UploadDictionary>
}

export function ErrorFilePreview({ uploadState, formatMessage }: ErrorFilePreviewProps) {
	const endUserMessages = uploadState.errors
		? uploadState.errors
				.filter(error => !!error.options.endUserMessage)
				.map(error => ({ message: formatMessage(error.options.endUserMessage!, 'upload.fileState.invalidFile') }))
		: []

	return (
		<FilePreview
			overlay={
				endUserMessages.length ? (
					<ErrorList errors={endUserMessages} />
				) : (
					<Message type="danger">{formatMessage('upload.fileState.invalidFile')}</Message>
				)
			}
		/>
	)
}
