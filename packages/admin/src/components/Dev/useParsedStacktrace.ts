import { ErrorType, ProcessedError } from '@contember/ui'
import { useEffect, useState } from 'react'

export const parseStacktrace = async (e: Error) => {
	const StackTracey = (await import('stacktracey')).default
	return (await new StackTracey(e).withSourcesAsync()).items.map(it => ({
		filename: it.fileShort,
		line: it.line,
		callee: it.callee,
		thirdParty: it.thirdParty,
		sourceCodeLines: it.sourceFile?.lines,
	}))
}

const createInitialError = (e: ErrorType): ProcessedError => ({
	error: e,
	cause: e instanceof Error && 'cause' in e && (e as any).cause !== undefined ? createInitialError((e as any).cause) : undefined,
})

export const useProcessedError = (e: ErrorType): ProcessedError => {
	const [error, setError] = useState<ProcessedError>(() => createInitialError(e))
	useEffect(() => {
		setError(createInitialError(e))
		if (!(e instanceof Error)) {
			return
		}
		const createErrorWithStackTrace = async (e: ErrorType): Promise<ProcessedError> => {
			return {
				error: e,
				parsedStackStrace: e instanceof Error ? await parseStacktrace(e) : undefined,
				cause: e instanceof Error && 'cause' in e && (e as any).cause !== undefined ? await createErrorWithStackTrace((e as any).cause) : undefined,
			}
		}
		(async () => {
			setError(await createErrorWithStackTrace(e))
		})()
	}, [e])

	return error
}
