import { useConstantValueInvariant } from '@contember/react-utils'
import {
	ReactNode,
	ComponentType,
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	FC,
	FunctionComponent,
	Fragment,
	PureComponent,
	useEffect,
} from 'react'
import { BlockCommonProps, useBlockProps } from '../../../blocks'
import { NormalizedDiscriminatedData, useDiscriminatedData } from '../../../discrimination'
import { EditorTemplate, getEditorTemplate } from './getEditorTemplate'
import { useEnvironment } from '@contember/binding'

export type NormalizedBlocks = NormalizedDiscriminatedData<BlockCommonProps>

export interface EditorReferenceBlock extends BlockCommonProps {
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

	return useDiscriminatedData<EditorReferenceBlock>(propsWithTemplates, {
		undiscriminatedItemMessage:
			`Each block must be discriminated by either exactly one of the ` +
			`'discriminateBy' or 'discriminateByScalar' props.`,
		mixedDiscriminationMessage:
			`Detected a set of Block components of non-uniform discrimination methods. ` +
			`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`,
	})
}
