import { memo, ReactNode } from 'react'
import { useSlateSelection } from 'slate-react'
import { cn } from '../../lib/utils/cn'

export interface HoveringToolbarsProps {
	children: ReactNode
}

export const BlockToolbar = memo(({ children }: HoveringToolbarsProps) => {
	const selection = useSlateSelection()

	return (
		<div className="static" contentEditable={false}>
			<div className={cn('-mx-3 -my-2 p-2 rounded-b-md border-t bg-gray-50 space-x-2', !selection && 'pointer-events-none opacity-50')}>{children}</div>
		</div>
	)
})
