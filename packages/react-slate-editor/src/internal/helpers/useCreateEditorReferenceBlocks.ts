import { Environment } from '@contember/react-binding'
import { ReactNode } from 'react'
import { blockAnalyzer } from './blockAnalyzer'
import { BlockProps, BlockContent, ContentOutletProps } from '../../components'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'

export interface EditorReferenceBlock extends BlockProps {
	isVoid: boolean
}

export type EditorReferenceBlocks = Record<string, EditorReferenceBlock>

export const getEditorReferenceBlocks = (children: ReactNode, env: Environment): EditorReferenceBlocks => {
	const blocks = blockAnalyzer.processChildren(children, env)

	const outletLeaf = new Leaf(node => node.props, BlockContent)

	const editorTemplateAnalyzer = new ChildrenAnalyzer<
		ContentOutletProps,
		never,
		Environment
	>([outletLeaf], {
		staticRenderFactoryName: 'staticRender',
		staticContextFactoryName: 'generateEnvironment',
	})

	return Object.fromEntries(blocks.map(
		(props): EditorReferenceBlock => ({
			...props,
			isVoid: editorTemplateAnalyzer.processChildren(props.children, env).length === 0,
		}),
	).map(it => [it.name, it]))
}
