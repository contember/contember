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
import { useClassNamePrefix } from '../auxiliary'

export interface TagProps {
	onRemove?: () => void
	children: ReactNode
}

export const Tag = memo<TagProps>(({ children, onRemove }) => {
	const prefix = useClassNamePrefix()
	return (
		<span className={`${prefix}tag`}>
			<span className={`${prefix}tag-text`}>{children}</span>
			{onRemove && (
				<button type="button" className={`${prefix}tag-remove`} onClick={onRemove}>
					×
				</button>
			)}
		</span>
	)
})
Tag.displayName = 'Tag'
