import { useClassName } from '@contember/utilities'
import { PropsWithChildren } from 'react'

export const StyleProvider = ({ children }: PropsWithChildren) => (
	<div className={useClassName('root')}>{children}</div>
)
StyleProvider.displayName = 'Interface.StyleProvider'
