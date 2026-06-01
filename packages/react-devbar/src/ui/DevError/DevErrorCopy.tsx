import { useCopyErrorMarkdown } from '../../hooks/useCopyErrorMarkdown.js'
import { ProcessedError } from './types.js'

export const DevErrorCopy = ({ currentError, currentErrorSource }: {
	currentError: ProcessedError
	currentErrorSource: string
}) => {
	const { copyStatus, handleCopyMarkdown, isClipboardSupported } = useCopyErrorMarkdown({ currentError, currentErrorSource })

	if (!isClipboardSupported) {
		return null
	}

	return (
		<button
			type="button"
			className="cui-devError-copyButton"
			onClick={handleCopyMarkdown}
			disabled={copyStatus === 'copying'}
			title="Copy current error as Markdown"
		>
			{{
				success: 'Copied!',
				copying: 'Copying...',
				error: '❌ Copy Failed',
				idle: 'Copy as Markdown',
			}[copyStatus]}
		</button>
	)
}
