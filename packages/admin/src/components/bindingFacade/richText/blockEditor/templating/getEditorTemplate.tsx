import { BindingError, Environment } from '@contember/binding'
import type { ReactNode } from 'react'
import { assertNever } from '../../../../../utils'
import type { ContentOutletProps } from './ContentOutlet'
import { BoxedCatchAllJSX, BoxedContentOutletProps, editorTemplateAnalyzer } from './editorTemplateAnalyzer'

export interface EditorTemplateAtom<Value> {
	nodeBefore: ReactNode
	value: Value
	nodeAfter: ReactNode
}

export type EditorTemplate =
	| undefined
	| {
			//leading: EditorTemplateAtom<TextFieldProps>[]
			blockContent: EditorTemplateAtom<ContentOutletProps> | undefined
			//trailing: EditorTemplateAtom<TextFieldProps>[]
	  }

export const getEditorTemplate = (blockContents: ReactNode, env: Environment): EditorTemplate => {
	let contentOutlet: ContentOutletProps | undefined = undefined
	const processed = editorTemplateAnalyzer.processChildren(blockContents, env)

	const nodesBefore: ReactNode[] = []
	const nodesAfter: ReactNode[] = []
	let currentTarget: ReactNode[] = nodesBefore

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
			nodeBefore: nodesBefore.length ? <>{nodesBefore}</> : undefined,
			value: contentOutlet,
			nodeAfter: nodesAfter.length ? <>{nodesAfter}</> : undefined,
		},
	}
}
