import { BindingError, Environment, useEnvironment, VariableInputTransformer } from '@contember/binding'
import { EditorToolbar, IconSourceSpecification, ToolbarGroup } from '@contember/ui'
import { memo, MouseEvent as ReactMouseEvent, useMemo } from 'react'
import { useSlateStatic } from 'slate-react'
import { getDiscriminatedDatum, SugaredDiscriminateBy } from '../../discrimination'
import type { ElementSpecificToolbarButton } from '../toolbars'
import type { EditorWithBlocks } from './editor'
import { ReferenceElement, referenceElementType } from './elements'
import type { EditorReferenceBlocks } from './templating'

export type BlockHoveringToolbarConfig =
	& IconSourceSpecification
	& {
		title?: string
	}
	& (
		| {
				discriminateBy: SugaredDiscriminateBy
		  }
		| ElementSpecificToolbarButton<any>
	)

export interface BlockHoveringToolbarContentsProps {
	editorReferenceBlocks: EditorReferenceBlocks
	blockButtons?: BlockHoveringToolbarConfig[] | BlockHoveringToolbarConfig[][]
	otherBlockButtons?: BlockHoveringToolbarConfig[]
}

function toToolbarGroups(
	editorReferenceBlocks: EditorReferenceBlocks,
	buttons: BlockHoveringToolbarContentsProps['blockButtons'],
	environment: Environment,
	editor: EditorWithBlocks,
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
					onClick: (e: ReactMouseEvent) => {
						e.nativeEvent.preventDefault()
						e.nativeEvent.stopPropagation()

						if ('discriminateBy' in buttonProps) {
							const discriminateBy = VariableInputTransformer.transformValue(buttonProps.discriminateBy, environment)
							const targetBlock = getDiscriminatedDatum(editorReferenceBlocks, discriminateBy)

							if (targetBlock === undefined) {
								throw new BindingError(
									`BlockEditor: Trying to insert a block discriminated by '${discriminateBy}' but no such block has been found!`,
								)
							}
							let insertedElement: Omit<ReferenceElement, 'referenceId'>

							if (targetBlock.datum.template === undefined) {
								insertedElement = {
									type: referenceElementType,
									children: [{ text: '' }],
								}
							} else {
								insertedElement = {
									type: referenceElementType,
									children: [editor.createDefaultElement([{ text: '' }])],
								}
							}

							editor.insertElementWithReference(insertedElement, discriminateBy)
						} else {
							editor.toggleElement(buttonProps.elementType, buttonProps.suchThat)
						}
					},
				}
			}),
		}
	})
}

export const BlockHoveringToolbarContents = memo((props: BlockHoveringToolbarContentsProps) => {
	const editor = useSlateStatic() as EditorWithBlocks
	const environment = useEnvironment()

	const { editorReferenceBlocks, blockButtons, otherBlockButtons } = props

	const groups = useMemo<ToolbarGroup[]>(() => {
		return toToolbarGroups(editorReferenceBlocks, blockButtons, environment, editor)
	}, [editorReferenceBlocks, blockButtons, environment, editor])

	const restGroups = useMemo<ToolbarGroup[] | undefined>(() => {
		return otherBlockButtons
			? toToolbarGroups(editorReferenceBlocks, otherBlockButtons, environment, editor)
			: undefined
	}, [otherBlockButtons, editorReferenceBlocks, environment, editor])

	if (!props.blockButtons || !props.blockButtons.length) {
		return null
	}

	return <EditorToolbar isActive groups={groups} restGroups={restGroups} />
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
