import { ReactElement } from 'react'
import { Editable } from 'slate-react'

type EditableProps = typeof Editable extends (p: infer P) => any ? P : never

export interface EditableCanvasProps extends EditableProps {
	leading?: ReactElement
	trailing?: ReactElement
}

export const EditableCanvas = ({ leading, trailing, className, ...editableProps }: EditableCanvasProps) => {
	return <div className={className}>
		{leading}
		<Editable {...editableProps}/>
		{trailing}
	</div>
}
