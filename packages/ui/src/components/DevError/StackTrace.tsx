import { useClassNameFactory } from '@contember/utilities'
import { ParsedStackFrame, ParsedStackTrace } from './types'

export const StackTrace = ({ stackTrace }: { stackTrace: ParsedStackTrace }) => {
	const componentClassName = useClassNameFactory('devError')

	return (
		<div className={componentClassName('stack')}>
			{stackTrace.map((it, index) => (
				<StackFrame stackFrame={it} key={index} />
			))}
		</div>
	)
}

const StackFrame = ({ stackFrame }: { stackFrame: ParsedStackFrame }) => {
	const componentClassName = useClassNameFactory('devError')
	const line = stackFrame.line

	return (
		<div className={componentClassName('stackFrame')}>
			<div className={componentClassName('stackFrameHeader')}>
				<div className={componentClassName('stackFrameSource')}>
					{stackFrame.filename}:{line}
				</div>
				{stackFrame.callee && <div className={componentClassName('stackFrameCallee')}>{stackFrame.callee}</div>}
			</div>
			{line !== undefined && stackFrame.sourceCodeLines && (
				<div className={componentClassName('stackFrameCode')}>
					{stackFrame.sourceCodeLines.map((it, index) => {
						const lineNumber = index + 1
						if (lineNumber + 5 < line || lineNumber - 3 > line) {
							return null
						}
						return (
							<div
								className={componentClassName('stackFrameLine', lineNumber === line && 'is-active')}
								key={lineNumber}
							>
								<div className={componentClassName('stackFrameLineNumber')}>{lineNumber}</div>
								<div className={componentClassName('stackFrameLineCode')}>{it}</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
