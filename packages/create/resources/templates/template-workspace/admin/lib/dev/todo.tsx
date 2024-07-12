import { PropsWithChildren } from 'react'

export interface CommentProps extends PropsWithChildren {
}

export const Todo = ({ children }: CommentProps) => {
	if (!import.meta.env.DEV) return null

	return (
		<div className="bg-yellow-100 p-4">
			<strong>TODO:</strong> {children}
		</div>
	)
}
