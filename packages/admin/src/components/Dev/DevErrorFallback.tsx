import { DevError, Portal } from '@contember/ui'
import { FallbackProps } from 'react-error-boundary'
import { useProcessedError } from './useParsedStacktrace'

export function DevErrorFallback({ error }: FallbackProps) {
	return (
		<Portal>
			<DevError error={useProcessedError(error)} source={'Page error boundary'} />
		</Portal>
	)
}
