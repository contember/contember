import { Scalar, useEnvironment, VariableInputTransformer, VariableLiteral } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { Button, ButtonGroup, Icon, IconSourceSpecification } from '@contember/ui'
import * as React from 'react'
import { useEditor } from 'slate-react'
import { ContemberBlockElement, contemberBlockElementType } from '../elements'

export type BlockHoveringToolbarConfig = IconSourceSpecification & {
	title?: string
} & (
		| {
				discriminateBy: GraphQlBuilder.Literal | VariableLiteral | string
		  }
		| {
				discriminateByScalar: Scalar
		  }
	)

export interface BlockHoveringToolbarContentsProps {
	blockButtons?: BlockHoveringToolbarConfig[]
}

export const BlockHoveringToolbarContents = React.memo((props: BlockHoveringToolbarContentsProps) => {
	const editor = useEditor()
	const environment = useEnvironment()

	if (!props.blockButtons || !props.blockButtons.length) {
		return null
	}

	return (
		// TODO
		<ButtonGroup size="large">
			{props.blockButtons.map((buttonProps, i) => {
				return (
					<Button
						size="large"
						key={i}
						title={buttonProps.title}
						onClick={() => {
							const discriminateBy =
								'discriminateBy' in buttonProps
									? VariableInputTransformer.transformVariableLiteral(buttonProps.discriminateBy, environment)
									: VariableInputTransformer.transformValue(buttonProps.discriminateByScalar, environment)
							const contemberBlockElement: ContemberBlockElement = {
								type: contemberBlockElementType,
								blockType: discriminateBy,
								entityKey: '', // Any string will do from here.
								children: [{ text: '' }],
							}
							editor.insertNode(contemberBlockElement)
						}}
					>
						<Icon
							blueprintIcon={buttonProps.blueprintIcon}
							contemberIcon={buttonProps.contemberIcon}
							customIcon={buttonProps.customIcon}
						/>
					</Button>
				)
			})}
		</ButtonGroup>
	)
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
