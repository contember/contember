import * as React from 'react'

/**
 * This allows heuristically detecting when a mouse click on a link was likely meant to open a new tab/window.
 */
export const isSpecialLinkClick = (e: React.MouseEvent<HTMLAnchorElement>): boolean =>
	e.metaKey || e.altKey || e.ctrlKey || e.shiftKey
