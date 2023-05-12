import { useClassNameFactory } from '@contember/utilities'
import { StackTrace } from './StackTrace'
import type { ProcessedError } from './types'

export interface DevErrorInnerProps {
	error: ProcessedError
	level?: number
}

export function DevErrorInner({ error, level = 1 }: DevErrorInnerProps) {
	const componentClassName = useClassNameFactory('devError')

	let errorObject: Error | undefined = error.error instanceof Error ? error.error : undefined

	return (
		<>
			<div className={componentClassName('header')}>
				{errorObject ? (
					<>
						<h1 className={componentClassName('errorName')}>{errorObject.name}</h1>
						{error.cause && <a href={`#error-${level}`} className={componentClassName('causeLink')}>caused by &gt;</a>}
						{errorObject.message && <h2 className={componentClassName('errorMessage')}>{errorObject.message}</h2>}
						{'details' in errorObject && <h3 className={componentClassName('errorDetails')}>{(errorObject as any).details}</h3>}
					</>
				) : (
					<h1 className={componentClassName('errorName')}>Unknown error</h1>
				)}
			</div>
			{error.parsedStackStrace ? (
				<StackTrace stackTrace={error.parsedStackStrace} />
			) : errorObject?.stack ? (
				<div className={componentClassName('stack')}>
					<div className={componentClassName('stack-dump')}>{errorObject.stack}</div>
				</div>
			) : null}
			{error.cause ? (
				<>
					<div className={componentClassName('causedBy')} id={`error-${level}`}>
						Caused by
					</div>
					<DevErrorInner error={error.cause} level={level + 1} />
				</>
			) : null}
		</>
	)
}
