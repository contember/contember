import * as React from 'react'
import { useClassNamePrefix } from '../auxiliary'

export interface LayoutProps {
	children?: React.ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
	const prefix = useClassNamePrefix()
	return <div className={`${prefix}layout`}>{children}</div>
}
Layout.displayName = 'Layout'
