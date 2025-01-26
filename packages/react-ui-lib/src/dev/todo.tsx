import { ReactNode } from 'react'

/**
 * Props for the {@link Comment} component.
 */
export interface CommentProps {
	/**
	 * The comment content or message
	 */
	children: ReactNode
}

/**
 * Props {@link CommentProps}.
 *
 * `Todo` is a development-only helper component for marking TODOs in the UI.
 * It displays a highlighted message when in development mode (`import.meta.env.DEV`).
 *
 * #### Example: Basic Usage
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
