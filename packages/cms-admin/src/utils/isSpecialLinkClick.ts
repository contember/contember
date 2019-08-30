import * as React from 'react'

/**
 * This allows heuristically detecting when a mouse click on a link was likely meant to open a new tab/window.
 */
export const isSpecialLinkClick = (e: MouseEvent): boolean => e.metaKey || e.altKey || e.ctrlKey || e.shiftKey // @TODO: check instanceof HTMLAnchorElement
