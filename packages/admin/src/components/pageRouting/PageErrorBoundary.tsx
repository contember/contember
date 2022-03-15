import { Message } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { ErrorBoundary, FallbackProps } from 'react-error-boundary'
import { DevErrorFallback } from '../Dev'

export interface PageErrorBoundaryProps {
	children: ReactNode
}

export const PageErrorBoundary = memo((props: PageErrorBoundaryProps) => (
	<ErrorBoundary FallbackComponent={import.meta.env.DEV && import.meta.env.MODE !== 'test' ? DevErrorFallback : ProdErrorFallback}>
		{props.children}
	</ErrorBoundary>
))

function ProdErrorFallback({}: FallbackProps) {
	return (
		<div>
			<Message intent="danger" size="large">
				Fatal error!
			</Message>
		</div>
	)
}
