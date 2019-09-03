import * as React from 'react'
import { HeadingDepthContext } from '../contexts'
import { HeadingDepth } from '../types'

export interface LowerHeadingLevelProps {
	currentDepth: HeadingDepth
	children: React.ReactNode
}

export const IncreaseHeadingDepth = React.memo<LowerHeadingLevelProps>(({ currentDepth, children }) => (
	<HeadingDepthContext.Provider value={Math.max(currentDepth + 1, 6) as HeadingDepth}>
		{children}
	</HeadingDepthContext.Provider>
))
