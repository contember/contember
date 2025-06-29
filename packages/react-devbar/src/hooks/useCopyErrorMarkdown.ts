import { useState } from 'react'
import type { ParsedStackTrace, ProcessedError } from '../ui/DevError/types'

const convertStackTraceToMarkdown = (stackTrace: ParsedStackTrace, lines: string[]) => {
	stackTrace.forEach((frame, index) => {
		lines.push(`**Frame ${index + 1}:**`)
		lines.push('')
		lines.push(`- **File:** ${frame.filename}${frame.line ? `:${frame.line}` : ''}`)

		if (frame.callee) {
			lines.push(`- **Function:** ${frame.callee}`)
		}

		lines.push('')

		if (frame.line !== undefined && frame.sourceCodeLines) {
			lines.push('**Source Code:**')
			lines.push('')
			lines.push('```typescript')

			frame.sourceCodeLines.forEach((codeLine, lineIndex) => {
				const lineNumber = lineIndex + 1
				// Show context around the error line (similar to the UI logic)
				if (frame.line && lineNumber + 5 >= frame.line && lineNumber - 3 <= frame.line) {
					const isErrorLine = lineNumber === frame.line
					const marker = isErrorLine ? '>>> ' : '    '
					lines.push(`${marker}${lineNumber.toString().padStart(3)}: ${codeLine}`)
				}
			})

			lines.push('```')
			lines.push('')
		}

		lines.push('---')
		lines.push('')
	})
}

const convertErrorToMarkdownRecursive = (error: ProcessedError, lines: string[], level: number) => {
	const errorObject = error.error instanceof Error ? error.error : undefined
	const prefix = '#'.repeat(level + 1)

	if (errorObject) {
		lines.push(`${prefix} ${errorObject.name}`)
		lines.push('')

		if (errorObject.message) {
			lines.push(`**Message:** ${errorObject.message}`)
			lines.push('')
		}

		if ('details' in errorObject && (errorObject as Error & { details?: unknown }).details) {
			lines.push(`**Details:** ${(errorObject as Error & { details: string }).details}`)
			lines.push('')
		}
	} else {
		lines.push(`${prefix} Unknown Error`)
		lines.push('')
	}

	if (error.parsedStackStrace) {
		lines.push(`${'#'.repeat(level + 2)} Stack Trace`)
		lines.push('')
		convertStackTraceToMarkdown(error.parsedStackStrace, lines)
	} else if (errorObject?.stack) {
		lines.push(`${'#'.repeat(level + 2)} Stack Trace`)
		lines.push('')
		lines.push('```')
		lines.push(errorObject.stack)
		lines.push('```')
		lines.push('')
	}

	if (error.cause) {
		lines.push(`${'#'.repeat(level + 2)} Caused By`)
		lines.push('')
		convertErrorToMarkdownRecursive(error.cause, lines, level + 1)
	}
}

const convertErrorToMarkdown = (error: ProcessedError, source: string): string => {
	const lines: string[] = []

	lines.push('# Contember Error Report')
	lines.push('')
	lines.push(`**Source:** ${source}`)
	lines.push('')

	convertErrorToMarkdownRecursive(error, lines, 1)

	return lines.join('\n')
}

const copyMarkdownToClipboard = async (content: string): Promise<void> => {
	if (!navigator.clipboard) {
		throw new Error('Clipboard API not supported')
	}

	try {
		await navigator.clipboard.writeText(content)
	} catch (err) {
		console.error('Failed to copy to clipboard:', err)
		throw new Error('Failed to copy to clipboard')
	}
}

type CopyMarkdownProps = {
	currentError: ProcessedError
	currentErrorSource: string
}

export const useCopyErrorMarkdown = ({ currentError, currentErrorSource }: CopyMarkdownProps) => {
	const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle')

	const handleCopyMarkdown = async () => {
		setCopyStatus('copying')
		try {
			if (!navigator.clipboard) {
				throw new Error('Clipboard API not supported in this browser')
			}

			const markdown = convertErrorToMarkdown(currentError, currentErrorSource)
			await copyMarkdownToClipboard(markdown)
			setCopyStatus('success')
			setTimeout(() => setCopyStatus('idle'), 2000)
		} catch (err) {
			console.error('Failed to copy markdown:', err)
			setCopyStatus('error')
			setTimeout(() => setCopyStatus('idle'), 3000)
		}
	}



	const isClipboardSupported = typeof navigator !== 'undefined' && !!navigator.clipboard

	return {
		copyStatus,
		setCopyStatus,
		handleCopyMarkdown,
		isClipboardSupported,
	}
}
