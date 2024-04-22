import { Slots } from '../../lib/components/slots'
import { Binding, PersistButton } from '../../lib/components/binding'
import * as React from 'react'
import { DimensionsSwitcher, SideDimensions } from '../../lib/components/dimensions'
import { EntitySubTree, Field, Variable } from '@contember/interface'
import { InputField, TextareaField } from '../../lib/components/form'
import { Card, CardContent, CardHeader, CardTitle } from '../../lib/components/ui/card'

export default () => {
	return <>
		<Binding>
			<DimensionsSwitcher
				options="DimensionsLocale"
				slugField="code"
				dimension="locale"
				isMulti
			>
				<Field field="label" />
			</DimensionsSwitcher>
		</Binding>

		<Binding>
			<Slots.Actions><PersistButton /></Slots.Actions>
			<EntitySubTree entity="DimensionsItem(unique=unique)">
				<SideDimensions dimension="locale" as="currentLocale" field="locales(locale.code=$currentLocale)">
					<Card>
						<CardHeader>
							<CardTitle><Variable name="currentLocale" /></CardTitle>
						</CardHeader>
						<CardContent>
							<InputField field="title" />
							<TextareaField field="content" />
						</CardContent>
					</Card>
				</SideDimensions>
			</EntitySubTree>
		</Binding>
	</>
}
