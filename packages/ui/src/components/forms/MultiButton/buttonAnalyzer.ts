import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '@contember/react-multipass-rendering'
import type { ReactElement } from 'react'
import { IllegalChildrenError } from '../../../errors'
import { Button, ButtonProps } from '../Button'
import { FormGroup, FormGroupProps } from '../FormGroup'

export class BoxedButtonProps {
	public constructor(public readonly props: ButtonProps) {}
}

export class ButtonFormGroupProps {
	public constructor(public readonly formGroupProps: FormGroupProps, public readonly buttonProps: ButtonProps) {}
}

const buttonLeaf = new Leaf(node => new BoxedButtonProps(node.props), Button)

const formGroupBranchNode = new BranchNode(
	(
		{ props }: ReactElement<FormGroupProps>,
		childrenRepresentation: RawNodeRepresentation<BoxedButtonProps, ButtonFormGroupProps>,
	) => {
		if (childrenRepresentation instanceof BoxedButtonProps) {
			return new ButtonFormGroupProps(props, childrenRepresentation.props)
		}
		if (
			Array.isArray(childrenRepresentation) &&
			childrenRepresentation.length === 1 &&
			childrenRepresentation[0] instanceof BoxedButtonProps
		) {
			return new ButtonFormGroupProps(props, childrenRepresentation[0].props)
		}
		throw new IllegalChildrenError(
			`The MultiButton component can accept FormGroup components as children but those must contain exactly one Button component.`,
		)
	},
	FormGroup,
)

export const buttonAnalyzer = new ChildrenAnalyzer([buttonLeaf], [formGroupBranchNode])
