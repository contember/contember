import { useClassNamePrefix } from '../../auxiliary'
import cn from 'classnames'
import { ParsedStackFrame, ParsedStackTrace } from './types'


export const StackTrace = ({ stackTrace }: { stackTrace: ParsedStackTrace }) => {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}devError-stack`}>
			{stackTrace.map((it, index) => (
				<StackFrame stackFrame={it} key={index} />
			))}
		</div>
	)
}

const StackFrame = ({ stackFrame }: { stackFrame: ParsedStackFrame }) => {
	const prefix = useClassNamePrefix()
	const line = stackFrame.line
	return (
		<div className={`${prefix}devError-stackFrame`}>
			<div className={`${prefix}devError-stackFrameHeader`}>
				<div className={`${prefix}devError-stackFrameSource`}>
					{stackFrame.filename}:{line}
				</div>
				{stackFrame.callee && <div className={`${prefix}devError-stackFrameCallee`}>{stackFrame.callee}</div>}
			</div>
			{line !== undefined && stackFrame.sourceCodeLines && (
				<div className={`${prefix}devError-stackFrameCode`}>
					{stackFrame.sourceCodeLines.map((it, index) => {
						const lineNumber = index + 1
						if (lineNumber + 5 < line || lineNumber - 3 > line) {
							return null
						}
						return (
							<div
								className={cn(`${prefix}devError-stackFrameLine`, lineNumber === line && 'is-active')}
								key={lineNumber}
							>
								<div className={`${prefix}devError-stackFrameLineNumber`}>{lineNumber}</div>
								<div className={`${prefix}devError-stackFrameLineCode`}>{it}</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
