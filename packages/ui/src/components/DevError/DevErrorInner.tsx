import { useClassNamePrefix } from '../../auxiliary'
import type { ProcessedError } from './types'
import { StackTrace } from './StackTrace'

export interface DevErrorInnerProps
{
	error: ProcessedError
	level?: number
}

export function DevErrorInner({ error, level = 1 }: DevErrorInnerProps) {
	const prefix = useClassNamePrefix()

	let errorObject: Error | undefined = error.error instanceof Error ? error.error : undefined

	return (
		<>
			<div className={`${prefix}devError-header`} >
				{errorObject ? (
					<>
						<h1 className={`${prefix}devError-errorName`}>{errorObject.name}</h1>
						{error.cause && <a href={`#error-${level}`} className={`${prefix}devError-causeLink`}>caused by &gt;</a>}
						{errorObject.message && <h2 className={`${prefix}devError-errorMessage`}>{errorObject.message}</h2>}
					</>
				) : (
					<h1 className={`${prefix}devError-errorName`}>Unknown error</h1>
				)}
			</div>
			{error.parsedStackStrace ? (
				<StackTrace stackTrace={error.parsedStackStrace} />
			) : errorObject?.stack ? (
				<div className={`${prefix}devError-stack`}>
					<div className={`${prefix}devError-stack-dump`}>{errorObject.stack}</div>
				</div>
			) : null}
			{error.cause ? (
				<>
					<div className={`${prefix}devError-causedBy`} id={`error-${level}`}>
						Caused by
					</div>
					<DevErrorInner error={error.cause} level={level + 1} />
				</>
			) : null}
		</>
	)
}
