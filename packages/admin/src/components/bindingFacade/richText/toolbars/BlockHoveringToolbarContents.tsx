import { FieldValue } from '@contember/binding'
import { BlueprintIconName, Button, ButtonGroup, Icon } from '@contember/ui'
import * as React from 'react'
import { useEditor } from 'slate-react'
import { contemberBlockElementType } from '../blockEditor'

export type BlockHoveringToolbarConfig = {
	blueprintIcon: BlueprintIconName
	discriminateBy: FieldValue
}

export interface BlockHoveringToolbarContentsProps {
	blockButtons?: BlockHoveringToolbarConfig[]
}

export const BlockHoveringToolbarContents = React.memo((props: BlockHoveringToolbarContentsProps) => {
	const editor = useEditor()

	if (!props.blockButtons || !props.blockButtons.length) {
		return null
	}

	return (
		// TODO
		<ButtonGroup size="large">
			{props.blockButtons.map(({ blueprintIcon, discriminateBy }, i) => {
				return (
					<Button
						size="large"
						key={i}
						onClick={() => {
							editor.insertNode({
								type: contemberBlockElementType,
								blockType: discriminateBy,
								entityKey: '', // Any string will do from here.
								children: [{ text: '' }],
							})
						}}
					>
						<Icon blueprintIcon={blueprintIcon} />
					</Button>
				)
			})}
		</ButtonGroup>
	)
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
