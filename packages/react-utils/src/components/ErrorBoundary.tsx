import { Component, ReactNode } from 'react'

export interface ErrorBoundaryProps {
	fallback: ReactNode
	children?: ReactNode
}

/**
 * Renders `fallback` instead of `children` once a descendant throws during rendering.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { didCatch: boolean }> {
	override state = { didCatch: false }

	static getDerivedStateFromError(): { didCatch: boolean } {
		return { didCatch: true }
	}

	override render(): ReactNode {
		return this.state.didCatch ? this.props.fallback : this.props.children
	}
}
