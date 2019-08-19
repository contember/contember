import * as React from 'react'

export const LayoutInner: React.FC<{}> = ({ children }) => {
	return <div className="layout-content-in">{children}</div>
}

export const LayoutSide: React.FC<{}> = ({ children }) => {
	return <div className="layout-content-side">{children}</div>
}
