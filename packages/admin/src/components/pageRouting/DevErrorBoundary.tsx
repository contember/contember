import { DevError, Portal } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

export interface DevErrorBoundaryProps {
	children: ReactNode
}

export const DevErrorBoundary = memo((props: DevErrorBoundaryProps) => {
	if (!__DEV_MODE__) {
		return <>{props.children}</>
	}
	return <ErrorBoundary FallbackComponent={DevErrorFallback}>{props.children}</ErrorBoundary>
})

function DevErrorFallback({ error }: FallbackProps) {
	return (
		<Portal>
			<DevError error={error} />
		</Portal>
	)
}
