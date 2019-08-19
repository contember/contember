import * as React from 'react'
import cn from 'classnames'

export const LayoutInner: React.FC<{}> = ({ children }) => {
	return <div className="layout-content-in">{children}</div>
}

export interface LayoutSideProps {
	showBox?: boolean
}

export const LayoutSide: React.FC<LayoutSideProps> = ({ children, showBox }) => {
	return <div className={cn('layout-content-side', showBox && 'view-boxed')}>{children}</div>
}
