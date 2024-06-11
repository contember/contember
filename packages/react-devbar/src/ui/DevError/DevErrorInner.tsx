import { StackTrace } from './StackTrace'
import type { ProcessedError } from './types'

export interface DevErrorInnerProps {
	error: ProcessedError
	level?: number
}


const className = (cls?: string | null) => cls ? `cui-devError-${cls}` : 'cui-devError'

export function DevErrorInner({ error, level = 1 }: DevErrorInnerProps) {

	let errorObject: Error | undefined = error.error instanceof Error ? error.error : undefined

	return (
		<>
			<div className={className('header')}>
				{errorObject ? (
					<>
						<h1 className={className('errorName')}>{errorObject.name}</h1>
						{error.cause && <a href={`#error-${level}`} className={className('causeLink')}>caused by &gt;</a>}
						{errorObject.message && <h2 className={className('errorMessage')}>{errorObject.message}</h2>}
						{'details' in errorObject && <h3 className={className('errorDetails')}>{(errorObject as any).details}</h3>}
					</>
				) : (
					<h1 className={className('errorName')}>Unknown error</h1>
				)}
			</div>
			{error.parsedStackStrace ? (
				<StackTrace stackTrace={error.parsedStackStrace} />
			) : errorObject?.stack ? (
				<div className={className('stack')}>
					<div className={className('stack-dump')}>{errorObject.stack}</div>
				</div>
			) : null}
			{error.cause ? (
				<>
					<div className={className('causedBy')} id={`error-${level}`}>
						Caused by
					</div>
					<DevErrorInner error={error.cause} level={level + 1} />
				</>
			) : null}
		</>
	)
}
