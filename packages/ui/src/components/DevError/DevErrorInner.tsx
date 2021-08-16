import { useClassNamePrefix } from '../../auxiliary'
import type { ErrorType, ParsedStackFrame } from './types'
import { StackTrace } from './StackTrace'

export interface DevErrorInnerProps
{
	error: ErrorType
	parsedStacktrace?: ParsedStackFrame[]
	source: string
}

export function DevErrorInner(props: DevErrorInnerProps) {
	const prefix = useClassNamePrefix()

	let error: Error | undefined = props.error instanceof Error ? props.error : undefined

	return (
		<>
			<div className={`${prefix}devError-header`}>
				{error ? (
					<>
						<h1 className={`${prefix}devError-errorName`}>{error.name}</h1>
						{error.message && <h2 className={`${prefix}devError-errorMessage`}>{error.message}</h2>}
					</>
				) : (
					<h1 className={`${prefix}devError-errorName`}>Unknown error</h1>
				)}
			</div>
			{props.parsedStacktrace ? (
				<StackTrace stackTrace={props.parsedStacktrace} />
			) : error?.stack ? (
				<div className={`${prefix}devError-stack`}>
					<div className={`${prefix}devError-stack-dump`}>{error.stack}</div>
				</div>
			) : null}
		</>
	)
}
