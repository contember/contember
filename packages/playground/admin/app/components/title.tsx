import { ReactNode } from 'react'

export const Title = ({ icon, children }: { icon?: ReactNode; children: ReactNode }) => {
	return (
		<div className="flex items-center">
			{icon && <div className="mr-2">{icon}</div>}
			<h1>{children}</h1>
		</div>
	)
}
