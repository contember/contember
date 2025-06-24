import { EntitySubTree, Field, Variable } from '@contember/interface'
import { LanguagesIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Binding, PersistButton } from '~/lib/binding'
import { DimensionsSwitcher, RenderLabelProps, SideDimensions } from '~/lib/dimensions'
import { InputField, TextareaField } from '~/lib/form'
import { Slots } from '~/lib/layout'
import { Card, CardContent, CardHeader, CardTitle } from '~/lib/ui/card'

const DimensionLabel = ({ label, dimensionValue }: RenderLabelProps) => {
	const getColor = (value: string | null) =>  value ? `hsl(${value.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) % 360}, 65%, 89%)` : '#000000'
	const color = getColor(dimensionValue)

	return (
		<div className="w-full flex justify-between items-center gap-2">
			{label}
			<div
				style={{ '--background-color': color } as React.CSSProperties}
				className="rounded-full px-2 text-sm font-medium text-gray-800 flex justify-center items-center shadow-sm transition-colors bg-(--background-color)"
			>
				{dimensionValue}
			</div>
		</div>
	)
}

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

			<h2 className="text-2xl font-semibold mt-10">With custom dimension labels</h2>
			<EntitySubTree entity="DimensionsItem(unique = unique)">
				<SideDimensions dimension="locale" as="currentLocale" field="locales(locale.code = $currentLocale)" renderLabel={DimensionLabel}>
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
