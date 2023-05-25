import { useClassName } from '@contember/utilities'
import { ReactNode } from 'react'

export const StyleProvider = ({ children }: { children: ReactNode }) => (
	<div className={useClassName('root')}>{children}</div>
)
