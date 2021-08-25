import { ErrorType, ParsedStackTrace } from '@contember/ui'
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
export const useParsedStacktrace = (e: ErrorType): undefined | ParsedStackTrace => {
	const [stackTrace, setStackTrace] = useState<ParsedStackTrace>()
	useEffect(() => {
		setStackTrace(undefined)
		if (!(e instanceof Error)) {
			return
		}
		(async () => {
			setStackTrace(await parseStacktrace(e))
		})()
	}, [e])
	return stackTrace
}
