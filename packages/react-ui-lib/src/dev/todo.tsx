import { ReactNode } from 'react'

export type CommentProps = {
	children: ReactNode
}

/**
 * Todo component - Development-only visual reminder component
 *
 * #### Purpose
 * Displays prominent TODO notes in the UI during development that automatically hide in production
 *
 * #### Features
 * - Bright yellow background for high visibility
 * - Renders only in development environment
 * - Zero production bundle impact
 *
 * #### Example
 * ```tsx
 * <Todo>
 *   Implement user profile editing functionality
 * </Todo>
 * ```
 */
export const Todo = ({ children }: CommentProps) => {
	if (!import.meta.env.DEV) return null

	return (
		<div className="bg-yellow-100 p-4">
			<strong>TODO:</strong> {children}
		</div>
	)
}
