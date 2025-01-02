import { EntitySubTree, Field, Variable } from '@contember/interface'
import { LanguagesIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Binding, PersistButton } from '~/lib/binding'
import { DimensionsSwitcher, SideDimensions } from '~/lib/dimensions'
import { InputField, TextareaField } from '~/lib/form'
import { Slots } from '~/lib/layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/lib/ui/card'

export default () => (
	<>
		<Slots.Title>
			<Title icon={<LanguagesIcon />}>Dimensions</Title>
		</Slots.Title>

		<Binding>
			<div>
				<DimensionsSwitcher
					options="DimensionsLocale"
					slugField="code"
					dimension="locale"
					isMulti
				>
					<Field field="label" />
				</DimensionsSwitcher>
			</div>
		</Binding>

		<Binding>
			<Slots.Actions><PersistButton /></Slots.Actions>
			<EntitySubTree entity="DimensionsItem(unique = unique)">
				<SideDimensions dimension="locale" as="currentLocale" field="locales(locale.code = $currentLocale)">
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
)
