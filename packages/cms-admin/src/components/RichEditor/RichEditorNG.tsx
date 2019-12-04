import * as React from 'react'
import { KeyUtils } from 'slate'
import { Component, Field, HasMany, useRelativeEntityList } from '../../binding'
import { InnerEditor, RTEProps } from './ng/InnerEditor'
import { generateUuid } from './utils'

KeyUtils.setGenerator((): string => {
	return generateUuid()
})

export const RichEditorNG = Component<RTEProps>(
	props => {
		const entityListAccessor = useRelativeEntityList(props)

		return <InnerEditor {...props} accessor={entityListAccessor} />
	},
	props => {
		const fields = Object.entries(props.blocks).map(([name, definition]) => {
			return definition.renderBlock !== undefined ? (
				<Field name={definition.valueField} key={name} />
			) : (
				<React.Fragment key={name}>{definition.render}</React.Fragment>
			)
		})

		return (
			<HasMany field={props.field}>
				<Field name={props.sortBy} isNonbearing={true} />
				<Field name={props.name} />
				{fields}
			</HasMany>
		)
	},
	'RichEditorNG',
)
