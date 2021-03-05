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
import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'

export interface UserMiniControlProps {
	avatarUrl?: string
	name: ReactNode
	note?: ReactNode
}

export function UserMiniControl({ name, note, avatarUrl }: UserMiniControlProps) {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}userMiniControl`)}>
			{avatarUrl && (
				<div className={`${prefix}userMiniControl-avatar`}>
					<img src={avatarUrl} className={`${prefix}userMiniControl-avatar-img`} alt="" />
				</div>
			)}
			<div className={`${prefix}userMiniControl-info`}>
				<span className={`${prefix}userMiniControl-name`}>{name}</span>
				{note && <span className={`${prefix}userMiniControl-note`}>{note}</span>}
			</div>
		</div>
	)
}
UserMiniControl.displayName = 'UserMiniControl'
