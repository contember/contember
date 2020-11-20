import { ElementNode, TextNode } from '../../../baseEditor'
import { PasteProcessor } from './PasteProcessor'

export type HandlerNext<T extends readonly unknown[]> = (children: NodeList, cumulativeTextAttrs: TextAttrs) => T
export type Processor<T extends readonly unknown[], R> = (
	element: HTMLElement,
	next: HandlerNext<T>,
	cumulativeTextAttrs: TextAttrs,
) => R | R[] | undefined

type Children = (ElementNode | TextNode)[]
export type BlockProcessor = Processor<Children, ElementNode>
export type InlineProcessor = Processor<Children, ElementNode | TextNode>
export type TextAttrs = { [key: string]: any }
export type AttributeProcessor = (element: HTMLElement) => TextAttrs | undefined
export type NodesWithTypeFiltered =
	| { texts: (TextNode | ElementNode)[]; elements?: undefined }
	| { elements: ElementNode[]; texts?: undefined }
export type NodesWithType =
	| NodesWithTypeFiltered
	| undefined
export type NodeListProcessor = (
	nodeList: Node[],
	processor: PasteProcessor,
	cumulativeTextAttrs: TextAttrs,
) => NodesWithType

export type PastePlugin = {
	blockProcessors: BlockProcessor[]
	inlineProcessors: InlineProcessor[]
	attributeProcessors: AttributeProcessor[]
	nodeListProcessors: NodeListProcessor[]
}

export const mergePastePlugins = (plugins: Partial<PastePlugin>[]): PastePlugin =>
	plugins.reduceRight<PastePlugin>(
		(prev, curr): PastePlugin => ({
			blockProcessors: [...prev.blockProcessors, ...(curr.blockProcessors ?? [])],
			inlineProcessors: [...prev.inlineProcessors, ...(curr.inlineProcessors ?? [])],
			attributeProcessors: [...prev.attributeProcessors, ...(curr.attributeProcessors ?? [])],
			nodeListProcessors: [...prev.nodeListProcessors, ...(curr.nodeListProcessors ?? [])],
		}),
		{ blockProcessors: [], inlineProcessors: [], attributeProcessors: [], nodeListProcessors: [] },
	)
