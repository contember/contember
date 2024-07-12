import { ParsedStackFrame, ParsedStackTrace } from './types'


const className = (cls?: string | null) => cls ? `cui-devError-${cls}` : 'cui-devError'
export const StackTrace = ({ stackTrace }: { stackTrace: ParsedStackTrace }) => {
	return (
		<div className={className('stack')}>
			{stackTrace.map((it, index) => (
				<StackFrame stackFrame={it} key={index} />
			))}
		</div>
	)
}

const StackFrame = ({ stackFrame }: { stackFrame: ParsedStackFrame }) => {
	const line = stackFrame.line

	return (
		<div className={className('stackFrame')}>
			<div className={className('stackFrameHeader')}>
				<div className={className('stackFrameSource')}>
					{stackFrame.filename}:{line}
				</div>
				{stackFrame.callee && <div className={className('stackFrameCallee')}>{stackFrame.callee}</div>}
			</div>
			{line !== undefined && stackFrame.sourceCodeLines && (
				<div className={className('stackFrameCode')}>
					{stackFrame.sourceCodeLines.map((it, index) => {
						const lineNumber = index + 1
						if (lineNumber + 5 < line || lineNumber - 3 > line) {
							return null
						}
						return (
							<div
								className={`${className('stackFrameLine')} ${lineNumber === line && 'is-active'}`}
								key={lineNumber}
							>
								<div className={className('stackFrameLineNumber')}>{lineNumber}</div>
								<div className={className('stackFrameLineCode')}>{it}</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
