import * as React from 'react'
import { useCallback, useState } from 'react'
import { RenderAttributes } from 'slate-react'
import cn from 'classnames'
import { BlocksDefinitions } from './types'

const AddBlockInnerButton: React.FC<{
	addBlock: (blockName: string, after: boolean) => void
	availableBlocks: BlocksDefinitions
	placement: 'top' | 'bottom'
}> = ({ addBlock, availableBlocks, placement }) => {
	const [isActive, setActive] = useState(false)
	const makeActive = useCallback(() => setActive(true), [setActive])
	const addBlockAndDeactivate = useCallback(
		blockName => {
			setActive(false)
			const addAfter = placement === 'bottom'
			addBlock(blockName, addAfter)
		},
		[setActive, addBlock],
	)

	return (
		<>
			{!isActive && (
				<div
					className={cn('richEditor-addBtnWrapper', placement === 'top' ? 'richEditor-top' : 'richEditor-bottom')}
					contentEditable={false}
				>
					<button className="richEditor-addBtn" onClick={makeActive}>
						+
					</button>
				</div>
			)}
			{isActive && (
				<div className="richEditor-availableBlocks" contentEditable={false}>
					{Object.entries(availableBlocks).map(([blockName, definition]) => (
						<button
							className="richEditor-availableBlock"
							key={blockName}
							onClick={() => addBlockAndDeactivate(blockName)}
						>
							{definition.label}
						</button>
					))}
					<button className="richEditor-availableBlock" onClick={() => setActive(false)}>
						×
					</button>
				</div>
			)}
		</>
	)
}

export const AddBlockButton: React.FC<{
	attributes: RenderAttributes
	addBlock: (blockName: string, after: boolean) => void
	availableBlocks: BlocksDefinitions
	isLast: boolean
}> = props => {
	return (
		<div className="richEditor-block" {...props.attributes}>
			<AddBlockInnerButton addBlock={props.addBlock} availableBlocks={props.availableBlocks} placement="top" />
			{props.children}
			{props.isLast && (
				<AddBlockInnerButton addBlock={props.addBlock} availableBlocks={props.availableBlocks} placement="bottom" />
			)}
		</div>
	)
}
