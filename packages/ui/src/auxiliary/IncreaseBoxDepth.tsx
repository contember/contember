import * as React from 'react'
import { BoxDepthContext } from '../contexts'
import { BoxDepth } from '../types'

export interface LowerBoxLevelProps {
	currentDepth: BoxDepth
	onlyIf?: boolean
	children: React.ReactNode
}

export const IncreaseBoxDepth = React.memo<LowerBoxLevelProps>(({ currentDepth, onlyIf, children }) => (
	<BoxDepthContext.Provider value={onlyIf ? (Math.min(currentDepth + 1, 6) as BoxDepth) : currentDepth}>
		{children}
	</BoxDepthContext.Provider>
))
IncreaseBoxDepth.displayName = 'IncreaseBoxDepth'
