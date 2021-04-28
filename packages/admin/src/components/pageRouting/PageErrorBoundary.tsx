import { DevError, Message, Portal } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'

export interface PageErrorBoundaryProps {
	children: ReactNode
}

export const PageErrorBoundary = memo((props: PageErrorBoundaryProps) => (
	<ErrorBoundary FallbackComponent={__DEV_MODE__ ? DevErrorFallback : ProdErrorFallback}>
		{props.children}
	</ErrorBoundary>
))

function DevErrorFallback({ error }: FallbackProps) {
	return (
		<Portal>
			<DevError error={error} />
		</Portal>
	)
}

function ProdErrorFallback({}: FallbackProps) {
	return (
		<div>
			<Message type="danger" size="large">
				Fatal error!
			</Message>
		</div>
	)
}
