import { BindingError } from '@contember/binding'
import { useConstantValueInvariant } from '@contember/react-utils'
import * as React from 'react'
import { assertNever } from '../../../../../utils'
import { ContentOutletProps } from './ContentOutlet'
import { BoxedCatchAllJSX, BoxedContentOutletProps, editorTemplateAnalyzer } from './editorTemplateAnalyzer'

export interface EditorTemplateAtom<Value> {
	nodeBefore: React.ReactNode
	value: Value
	nodeAfter: React.ReactNode
}

export type EditorTemplate =
	| undefined
	| {
			//leading: EditorTemplateAtom<TextFieldProps>[]
			blockContent: EditorTemplateAtom<ContentOutletProps> | undefined
			//trailing: EditorTemplateAtom<TextFieldProps>[]
	  }

export const getEditorTemplate = (blockContents: React.ReactNode): EditorTemplate => {
	let contentOutlet: ContentOutletProps | undefined = undefined
	const processed = editorTemplateAnalyzer.processChildren(blockContents, undefined)

	const nodesBefore: React.ReactNode[] = []
	const nodesAfter: React.ReactNode[] = []
	let currentTarget: React.ReactNode[] = nodesBefore

	for (const node of processed) {
		if (node instanceof BoxedContentOutletProps) {
			if (contentOutlet === undefined) {
				contentOutlet = node.value
				currentTarget = nodesAfter
			} else {
				throw new BindingError(`BlockEditor: There must be no more than one ContentOutlet per block!`)
			}
		} else if (node instanceof BoxedCatchAllJSX) {
			currentTarget.push(node.value)
		} else {
			assertNever(node)
		}
	}

	if (contentOutlet === undefined) {
		return undefined
	}
	return {
		blockContent: {
			nodeBefore: <>{nodesBefore}</>,
			value: contentOutlet,
			nodeAfter: <>{nodesAfter}</>,
		},
	}
}
