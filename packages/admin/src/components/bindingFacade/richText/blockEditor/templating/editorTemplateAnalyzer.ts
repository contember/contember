import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import * as React from 'react'
import { ContentOutlet, ContentOutletProps } from './ContentOutlet'
import { TextFieldProps } from './TextField'
import { Environment } from '@contember/binding'

export class BoxedTextFieldProps {
	public constructor(public readonly value: TextFieldProps) {}
}
export class BoxedContentOutletProps {
	public constructor(public readonly value: ContentOutletProps) {}
}
export class BoxedCatchAllJSX {
	public constructor(public readonly value: React.ReactNode) {}
}

//const textFieldLeaf = new Leaf(node => new BoxedTextFieldProps(node.props), TextField)
const outletLeaf = new Leaf(node => new BoxedContentOutletProps(node.props), ContentOutlet)
const catchAllJSXLeaf = new Leaf(node => new BoxedCatchAllJSX(node))

export const editorTemplateAnalyzer = new ChildrenAnalyzer<
	/*BoxedTextFieldProps |*/ BoxedContentOutletProps | BoxedCatchAllJSX,
	never,
	Environment
>([/*textFieldLeaf,*/ outletLeaf, catchAllJSXLeaf])
