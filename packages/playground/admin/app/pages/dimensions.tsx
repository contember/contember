import { Slots } from '@app/lib/layout'
import { Binding, PersistButton } from '@app/lib/binding'
import * as React from 'react'
import { DimensionsSwitcher, SideDimensions } from '@app/lib/dimensions'
import { EntitySubTree, Field, Variable } from '@contember/interface'
import { InputField, TextareaField } from '@app/lib/form'
import { Card, CardContent, CardHeader, CardTitle } from '@app/lib/ui/card'

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
