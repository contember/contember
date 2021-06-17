import type { Environment } from '@contember/binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import type { FileKindProps } from '../FileKind'
import { FileKind } from '../FileKind'

export class BoxedFileKindProps {
	public constructor(public readonly value: FileKindProps) {}
}

const fileKindLeaf = new Leaf<FileKindProps>(node => new BoxedFileKindProps(node.props), FileKind)

export const fileKindTemplateAnalyzer = new ChildrenAnalyzer<BoxedFileKindProps, never, Environment>([fileKindLeaf], {
	ignoreUnhandledNodes: false,
	staticRenderFactoryName: 'staticRender',
	unhandledNodeErrorMessage: 'Upload: only FileKind children are supported.',
})
