import * as React from 'react'
import { useCallback, useState } from 'react'
import { RenderAttributes } from 'slate-react'
import { BlocksDefinitions } from './types'

export const AddBlockButton: React.FC<{
	attributes: RenderAttributes
	addBlock: (blockName: string) => void
	availableBlocks: BlocksDefinitions
}> = props => {
	const [isActive, setActive] = useState(false)
	const makeActive = useCallback(() => setActive(true), [setActive])
	const { addBlock } = props
	const addBlockAndDeactivate = useCallback(
		blockName => {
			setActive(false)
			addBlock(blockName)
		},
		[setActive, addBlock]
	)

	return (
		<div className="richEditor-block" {...props.attributes}>
			{!isActive && (
				<div className="richEditor-top" contentEditable={false}>
					<button className="richEditor-addBtn" onClick={makeActive}>
						+
					</button>
				</div>
			)}
			{isActive && (
				<div className="richEditor-availableBlocks" contentEditable={false}>
					{Object.entries(props.availableBlocks).map(([blockName, definition]) => (
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
			{props.children}
		</div>
	)
}
