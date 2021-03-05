import {
	ReactNode,
	ReactElement,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	ComponentType,
	MouseEvent as ReactMouseEvent,
	memo,
	useState,
	useContext,
} from 'react'
import { HeadingDepthContext } from '../contexts'
import { HeadingDepth } from '../types'

export interface LowerHeadingLevelProps {
	currentDepth: HeadingDepth
	onlyIf?: boolean
	children: ReactNode
}

export const IncreaseHeadingDepth = memo<LowerHeadingLevelProps>(({ currentDepth, onlyIf, children }) => (
	<HeadingDepthContext.Provider value={onlyIf ? (Math.min(currentDepth + 1, 6) as HeadingDepth) : currentDepth}>
		{children}
	</HeadingDepthContext.Provider>
))
IncreaseHeadingDepth.displayName = 'IncreaseHeadingDepth'
