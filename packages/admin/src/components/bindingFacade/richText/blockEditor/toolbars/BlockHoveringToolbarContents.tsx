import { Scalar, useEnvironment, VariableInputTransformer, VariableLiteral } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'
import { Button, ButtonGroup, Dropdown, Icon, IconSourceSpecification } from '@contember/ui'
import * as React from 'react'
import { useEditor } from 'slate-react'
import { ContemberBlockElement, contemberBlockElementType } from '../elements'

export type BlockHoveringToolbarConfig = IconSourceSpecification & {
	title?: string
} & (
		| {
				discriminateBy: GraphQlBuilder.Literal | VariableLiteral | string
		  }
		| {
				discriminateByScalar: Scalar
		  }
	)

export interface BlockHoveringToolbarContentsProps {
	blockButtons?: BlockHoveringToolbarConfig[] | BlockHoveringToolbarConfig[][]
	otherBlockButtons?: BlockHoveringToolbarConfig[]
}

export const BlockHoveringToolbarContents = React.memo((props: BlockHoveringToolbarContentsProps) => {
	const editor = useEditor()
	const environment = useEnvironment()

	if (!props.blockButtons || !props.blockButtons.length) {
		return null
	}

	const mainSections = (Array.isArray(props.blockButtons[0])
		? props.blockButtons
		: [props.blockButtons]) as BlockHoveringToolbarConfig[][]

	const renderSection = (section: BlockHoveringToolbarConfig[]) => (
		<ButtonGroup size="large">
			{section.map((buttonProps, j) => {
				return (
					<Button
						size="large"
						key={j}
						title={buttonProps.title}
						onClick={() => {
							const discriminateBy =
								'discriminateBy' in buttonProps
									? VariableInputTransformer.transformVariableLiteral(buttonProps.discriminateBy, environment)
									: VariableInputTransformer.transformValue(buttonProps.discriminateByScalar, environment)
							const contemberBlockElement: ContemberBlockElement = {
								type: contemberBlockElementType,
								blockType: discriminateBy,
								entityKey: '', // Any string will do from here.
								children: [{ text: '' }],
							}
							editor.insertNode(contemberBlockElement)
						}}
					>
						<Icon
							blueprintIcon={buttonProps.blueprintIcon}
							contemberIcon={buttonProps.contemberIcon}
							customIcon={buttonProps.customIcon}
						/>
					</Button>
				)
			})}
		</ButtonGroup>
	)

	return (
		<>
			{mainSections.map((section, i) => (
				<React.Fragment key={i}>{renderSection(section)}</React.Fragment>
			))}
			{props.otherBlockButtons && (
				<Dropdown
					buttonProps={{
						children: <Icon blueprintIcon="more" />,
						size: 'large',
					}}
					alignment="top"
				>
					{renderSection(props.otherBlockButtons)}
				</Dropdown>
			)}
		</>
	)
})
BlockHoveringToolbarContents.displayName = 'BlockHoveringToolbarContents'
