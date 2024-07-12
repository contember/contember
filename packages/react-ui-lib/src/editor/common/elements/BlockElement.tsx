import { ContemberEditor } from '@contember/react-slate-editor-base'
import { memo } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from 'slate-react'
import { PlusCircleIcon } from 'lucide-react'

export interface BlockElementProps extends RenderElementProps {
	domElement?: keyof JSX.IntrinsicElements
	withBoundaries?: boolean
	className?: string
}

const BlockBoundary = ({ onClick }: {onClick: () => void}) => {
	return (<>
		<div className="relative group" contentEditable={false}>
			<div className="bg-gray-500 h-0.5 rounded absolute top-1/2 left-0 right-0 w-full opacity-0 transition-opacity delay-100 group-hover:opacity-100"></div>
			<div className="absolute -top-2 left-0 w-full h-4 flex justify-center items-center opacity-0 transition-opacity delay-100 duration-0 group-hover:opacity-100 cursor-pointer" onClick={onClick}>
				<div className=" px-2 flex gap-2 items-center bg-gray-800 py-0.5 rounded-xl text-white shadow ">
					<PlusCircleIcon className="w-3 h-3" />
					Add paragraph
				</div>
			</div>
		</div>
	</>)
}

export const BlockElement = memo(function BlockElement({ element, children, attributes, domElement = 'div', withBoundaries = false, className }: BlockElementProps) {
	const editor = useSlateStatic()
	const dataAttributes = ContemberEditor.getElementDataAttributes(element)
	const El = domElement as 'div'

	return (
		<El {...dataAttributes} {...attributes} className={className}>
			{withBoundaries && (
				<BlockBoundary onClick={() => {
					const elementPath = ReactEditor.findPath(editor, element)
					editor.insertBetweenBlocks([element, elementPath], 'before')
				}}/>
			)}
			{children}
			{withBoundaries && (
				<BlockBoundary onClick={() => {
					const elementPath = ReactEditor.findPath(editor, element)
					editor.insertBetweenBlocks([element, elementPath], 'after')
				}}/>
			)}
		</El>
	)
})
