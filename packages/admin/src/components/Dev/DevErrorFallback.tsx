import { DevError, Portal } from '@contember/ui'
import { FallbackProps } from 'react-error-boundary'
import { useParsedStacktrace } from './useParsedStacktrace'

export function DevErrorFallback({ error }: FallbackProps) {
	const stacktrace = useParsedStacktrace(error)
	return (
		<Portal>
			<DevError error={error} source={'Page error boundary'} parsedStacktrace={stacktrace} />
		</Portal>
	)
}
