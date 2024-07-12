import { Button } from '../ui/button'
import { PencilIcon, TrashIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Component } from '@contember/interface'
import { ReactNode, useCallback } from 'react'
import { Block, BlockContent, BlockRendererProps, useEditorBlockElement } from '@contember/react-slate-editor'
import { BlockElement } from './common/elements/BlockElement'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { Node, Transforms } from 'slate'

export interface EditorBlockProps {
	name: string
	label: ReactNode
	children: ReactNode
	alternate?: ReactNode
}

export const EditorBlock = Component<EditorBlockProps>(() => {
	return null
}, blockProps => {
	return (
		<Block
			name={blockProps.name}
			render={renderBlockProps => (
				<EditorBlockUi blockProps={blockProps} renderBlockProps={renderBlockProps} />
			)}
		>
			{blockProps.children}
			{blockProps.alternate}
		</Block>
	)
})

export const EditorBlockContent = Component(() => {
	const el = useEditorBlockElement().element
	const hasText = Node.string(el).length > 0
	return (
		<div className="py-2 relative">
			{!hasText && (
				<div className="absolute inset-0 flex items-center text-gray-400 pointer-events-none" contentEditable={false}>
					Type here...
				</div>
			)}
			<BlockContent />
		</div>
	)
}, () => <BlockContent />)

const EditorBlockUi = ({ blockProps, renderBlockProps }: {
	blockProps: EditorBlockProps
	renderBlockProps: BlockRendererProps }) => {
	const {
		children,
		alternate,
		label,
	} = blockProps
	const {
		element,
		attributes,
		children: elChildren,
		isVoid,
	} = renderBlockProps
	const editor = useSlateStatic()

	const onRemove = useCallback(() => {
		const path = ReactEditor.findPath(editor, element)
		Transforms.removeNodes(editor, {
			at: path,
		})
	}, [editor, element])

	return (
		<BlockElement element={element} attributes={attributes} withBoundaries>
			<div className="group -ml-3 p-3 border border-transparent rounded-md hover:shadow-md hover:border-gray-200 transition-all">
				<div contentEditable={false}>
					<div className="flex">
						<div className="text-gray-400 text-xs font-semibold">
							{label}
						</div>
						<div className="ml-auto opacity-0 group-hover:opacity-20 hover:!opacity-100 transition-opacity">
							<Button variant="destructive" onClick={onRemove} size="sm"><TrashIcon className="w-3 h-3" /></Button>
							{alternate && (<Popover>
								<PopoverTrigger asChild><Button size="sm"><PencilIcon className="w-3 h-3" /></Button></PopoverTrigger>
								<PopoverContent>{alternate}</PopoverContent>
							</Popover>)}
						</div>
					</div>
				</div>
				<div contentEditable={isVoid ? false : undefined}>
					{children}
					{isVoid ? elChildren : undefined}
				</div>
			</div>
		</BlockElement>
	)
}
