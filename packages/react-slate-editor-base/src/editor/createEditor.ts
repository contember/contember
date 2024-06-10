import { createEditorWithEssentials } from './createEditorWithEssentials'
import { Editor } from 'slate'
import { EditorPlugin, EditorPluginWrapperProps } from '../types'
import { createElement, FunctionComponent, ReactNode } from 'react'
import { EntityAccessor } from '@contember/binding'
import { Environment } from '@contember/react-binding'


export interface CreateEditorPublicOptions {
	plugins?: EditorPlugin[]
}

export interface CreateEditorOptions extends CreateEditorPublicOptions {
	defaultElementType: string
	entity: EntityAccessor
	environment: Environment
	children: ReactNode
}

export const createEditor = ({
	plugins = [],
	defaultElementType,
	entity,
	environment,
	children,
}: CreateEditorOptions): {
	editor: Editor,
	OuterWrapper: FunctionComponent<{ children: ReactNode }>
	InnerWrapper: FunctionComponent<{ children: ReactNode }>
} => {
	const editor = createEditorWithEssentials({ defaultElementType })
	const outerWrappers: FunctionComponent<EditorPluginWrapperProps>[] = []
	const innerWrappers: FunctionComponent<EditorPluginWrapperProps>[] = []
	plugins?.forEach(plugin => {
		if (typeof plugin === 'function') {
			plugin(editor)
			return
		}
		plugin.extendEditor?.({ editor, children, environment, entity })
		if (plugin?.OuterWrapper) {
			outerWrappers.push(plugin.OuterWrapper)
		}
		if (plugin?.InnerWrapper) {
			innerWrappers.push(plugin.InnerWrapper)
		}
	})
	return {
		editor,
		OuterWrapper: ({ children }) => outerWrappers.reduceRight((acc, Wrapper) => createElement(Wrapper, { editor }, acc), children),
		InnerWrapper: ({ children }) => innerWrappers.reduceRight((acc, Wrapper) => createElement(Wrapper, { editor }, acc), children),
	}
}
