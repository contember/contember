import { useEnvironment } from '@contember/react-binding'
import { useConstantValueInvariant } from '@contember/react-utils'
import { ReactNode, useMemo } from 'react'
import { BlockProps, useBlockProps } from '../../../blocks'
import { NormalizedDiscriminatedData, useDiscriminatedData } from '../../../discrimination'
import { EditorTemplate, getEditorTemplate } from './getEditorTemplate'

export interface EditorReferenceBlock extends BlockProps {
	template: EditorTemplate
}

export type EditorReferenceBlocks = NormalizedDiscriminatedData<EditorReferenceBlock>

export const useEditorReferenceBlocks = (children: ReactNode): EditorReferenceBlocks => {
	useConstantValueInvariant(children, `BlockEditor: cannot change the set of Blocks between renders!`)
	const env = useEnvironment()

	const propList = useBlockProps(children)
	const propsWithTemplates = useMemo(() => {
		return propList.map(
			(props): EditorReferenceBlock => ({
				...props,
				template: getEditorTemplate(props.children, env),
			}),
		)
	}, [env, propList])

	return useDiscriminatedData<EditorReferenceBlock>(propsWithTemplates)
}
