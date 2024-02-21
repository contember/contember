import { Portal } from '@contember/ui'
import { FallbackProps } from 'react-error-boundary'
import { DevError, useProcessedError } from '@contember/react-devbar'

export function DevErrorFallback({ error }: FallbackProps) {
	return (
		<Portal>
			<DevError error={useProcessedError(error)} source={'Page error boundary'} />
		</Portal>
	)
}
