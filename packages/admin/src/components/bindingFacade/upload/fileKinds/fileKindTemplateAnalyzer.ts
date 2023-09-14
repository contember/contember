import type { Environment } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import type { FileKindProps } from './FileKind'
import { FileKind } from './FileKind'

export class BoxedFileKind {
	public constructor(public readonly value: FileKindProps) {}
}

const fileKindLeaf = new Leaf<FileKindProps>(node => {
	return new BoxedFileKind(node.props)
}, FileKind)

export const fileKindTemplateAnalyzer = new ChildrenAnalyzer<BoxedFileKind, never, Environment>([fileKindLeaf], {
	ignoreUnhandledNodes: false,
	staticRenderFactoryName: 'staticRender',
	unhandledNodeErrorMessage: 'Upload: only FileKind children are supported.',
})
