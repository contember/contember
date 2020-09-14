import { Environment, Scalar, useEnvironment, VariableInputTransformer, VariableLiteral } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { EditorToolbar, IconSourceSpecification, ToolbarGroup } from '@contember/ui'
import * as React from 'react'
import { ReactEditor, useEditor } from 'slate-react'
import { ElementSpecificToolbarButton } from '../toolbars'
import { ContemberBlockElement, contemberBlockElementType } from './elements'

export type BlockHoveringToolbarConfig = IconSourceSpecification & {
	title?: string
} & (
		| {
				discriminateBy: GraphQlBuilder.Literal | VariableLiteral | string
		  }
		| {
				discriminateByScalar: Scalar
		  }
		| ElementSpecificToolbarButton<any>
	)

export interface BlockHoveringToolbarContentsProps {
	blockButtons?: BlockHoveringToolbarConfig[] | BlockHoveringToolbarConfig[][]
	otherBlockButtons?: BlockHoveringToolbarConfig[]
}

function toToolbarGroups(
	buttons: BlockHoveringToolbarContentsProps['blockButtons'],
	environment: Environment,
	editor: ReactEditor,
): ToolbarGroup[] {
	if (!buttons) {
		return []
	}

	const sections = (Array.isArray(buttons[0]) ? buttons : [buttons]) as BlockHoveringToolbarConfig[][]

	return sections.map(section => {
		return {
			buttons: section.map(buttonProps => {
				const { title, ...rest } = buttonProps
				return {
					label: title,
					...rest,
					onClick: (e: React.MouseEvent) => {
						e.nativeEvent.preventDefault()
						e.nativeEvent.stopPropagation()

						if ('discriminateBy' in buttonProps || 'discriminateByScalar' in buttonProps) {
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
						} else {
							editor.toggleElement(buttonProps.elementType, buttonProps.suchThat)
						}
					},
				}
			}),
		}
	})
}

export const BlockHoveringToolbarContents = React.memo((props: BlockHoveringToolbarContentsProps) => {
	const editor = useEditor()
	const environment = useEnvironment()

	const { blockButtons, otherBlockButtons } = props

	const groups = React.useMemo<ToolbarGroup[]>(() => {
		return toToolbarGroups(blockButtons, environment, editor)
	}, [blockButtons, environment, editor])

	const restGroups = React.useMemo<ToolbarGroup[] | undefined>(() => {
		return otherBlockButtons ? toToolbarGroups(otherBlockButtons, environment, editor) : undefined
	}, [otherBlockButtons, environment, editor])

	if (!props.blockButtons || !props.blockButtons.length) {
		return null
	}

	return <EditorToolbar isActive groups={groups} restGroups={restGroups} />
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
