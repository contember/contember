import * as React from 'react'
import { HeadingDepthContext } from '../contexts'
import { HeadingDepth } from '../types'

export interface LowerHeadingLevelProps {
	currentDepth: HeadingDepth
	onlyIf?: boolean
	children: React.ReactNode
}

export const IncreaseHeadingDepth = React.memo<LowerHeadingLevelProps>(({ currentDepth, onlyIf, children }) => (
	<HeadingDepthContext.Provider value={onlyIf ? (Math.min(currentDepth + 1, 6) as HeadingDepth) : currentDepth}>
		{children}
	</HeadingDepthContext.Provider>
))
IncreaseHeadingDepth.displayName = 'IncreaseHeadingDepth'
