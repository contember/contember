import { memo, ReactNode } from 'react'
import { useSlateSelection } from 'slate-react'
import { cn } from '../../utils'

export interface EditorBlockToolbarProps {
	children: ReactNode
}

export const EditorBlockToolbar = memo(({ children }: EditorBlockToolbarProps) => {
	const selection = useSlateSelection()

	return (
		<div className="sticky bottom-0" contentEditable={false}>
			<div className={cn('-mx-3 -mb-2 p-2 rounded-b-md border-t bg-gray-50 space-x-2', !selection && 'pointer-events-none')}>{children}</div>
		</div>
	)
})
