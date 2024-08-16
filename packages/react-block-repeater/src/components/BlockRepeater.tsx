import { Component, Field, SugaredRelativeSingleField } from '@contember/react-binding'
import { Repeater, RepeaterProps } from '@contember/react-repeater'
import { useState } from 'react'
import { extractBlocks } from '../internal/helpers/staticAnalyzer'
import { BlockRepeaterConfigContext } from '../contexts'

export type BlockRepeaterProps =
	& {
		sortableBy: RepeaterProps['sortableBy']
		discriminationField: SugaredRelativeSingleField['field']
	}
	& RepeaterProps

export const BlockRepeater = Component<BlockRepeaterProps>(({ children, ...props }, env) => {
	const [blocks] = useState(() => extractBlocks(children, env))
	if (Object.keys(blocks).length === 0) {
		throw new Error('BlockRepeater must have at least one Block child')
	}
	return (
		<Repeater {...props} initialEntityCount={0}>
			<BlockRepeaterConfigContext.Provider value={{ discriminatedBy: props.discriminationField, blocks }}>
				{children}
			</BlockRepeaterConfigContext.Provider>
		</Repeater>
	)
}, props => {
	return (
		<Repeater {...props}>
			{props.children}
			<Field field={props.discriminationField} />
		</Repeater>
	)
})
