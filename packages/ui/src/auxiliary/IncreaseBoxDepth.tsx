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
import { BoxDepthContext } from '../contexts'
import { BoxDepth } from '../types'

export interface LowerBoxLevelProps {
	currentDepth: BoxDepth
	onlyIf?: boolean
	children: ReactNode
}

export const IncreaseBoxDepth = memo<LowerBoxLevelProps>(({ currentDepth, onlyIf, children }) => (
	<BoxDepthContext.Provider value={onlyIf ? (Math.min(currentDepth + 1, 6) as BoxDepth) : currentDepth}>
		{children}
	</BoxDepthContext.Provider>
))
IncreaseBoxDepth.displayName = 'IncreaseBoxDepth'
