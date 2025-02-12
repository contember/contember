import React from 'react'

export type ErrorBoundaryProps = {
	fallback?: React.ReactNode
	children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, {
	hasError: boolean
}> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: unknown) {
		return { hasError: true }
	}

	override componentDidCatch(error: unknown, info: { componentStack: string }) {
		console.error(error, info.componentStack)
	}

	override render() {
		if (this.state.hasError) {
			return this.props.fallback ?? <div>Something went wrong</div>
		}

		return this.props.children
	}
}
