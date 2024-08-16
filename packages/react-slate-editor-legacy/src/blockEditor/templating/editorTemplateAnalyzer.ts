import type { Environment } from '@contember/react-binding'
import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import type { ReactNode } from 'react'
import { ContentOutlet, ContentOutletProps } from './ContentOutlet'
import type { TextFieldProps } from './TextField'

export class BoxedTextFieldProps {
	public constructor(public readonly value: TextFieldProps) {}
}
export class BoxedContentOutletProps {
	public constructor(public readonly value: ContentOutletProps) {}
}
export class BoxedCatchAllJSX {
	public constructor(public readonly value: ReactNode) {}
}

//const textFieldLeaf = new Leaf(node => new BoxedTextFieldProps(node.props), TextField)
const outletLeaf = new Leaf(node => new BoxedContentOutletProps(node.props), ContentOutlet)
const catchAllJSXLeaf = new Leaf(node => new BoxedCatchAllJSX(node))

export const editorTemplateAnalyzer = new ChildrenAnalyzer<
	/*BoxedTextFieldProps |*/ BoxedContentOutletProps | BoxedCatchAllJSX,
	never,
	Environment
>([/*textFieldLeaf, */outletLeaf, catchAllJSXLeaf])
