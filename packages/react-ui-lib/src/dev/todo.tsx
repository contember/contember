import { PropsWithChildren } from 'react'

/**
 * Props for the {@link Todo} component.
 */
export interface CommentProps extends PropsWithChildren {
}

/**
 * `Todo` is a development-only helper component for marking TODOs in the UI.
 * It displays a highlighted message when in development mode (`import.meta.env.DEV`).
 *
 * ## Example: Basic Usage
 * ```tsx
 * <Todo>Implement authentication logic</Todo>
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
