import type { SingleFileUploadState } from '@contember/react-client'
import { ErrorList, FilePreview, Message } from '@contember/ui'

export interface ErrorFilePreviewProps {
	uploadState: SingleFileUploadState & { readyState: 'error' }
}
export function ErrorFilePreview({ uploadState }: ErrorFilePreviewProps) {
	const endUserMessages = uploadState.errors
		? uploadState.errors
				.filter(error => !!error.options.endUserMessage)
				.map(error => ({ message: error.options.endUserMessage! }))
		: []

	return (
		<FilePreview
			overlay={
				endUserMessages.length ? <ErrorList errors={endUserMessages} /> : <Message type="danger">Invalid file.</Message>
			}
		/>
	)
}
