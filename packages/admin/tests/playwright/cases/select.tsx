import { ControlProps, ControlValueParser, CreatePage, FieldValueFormatter, Layout, Select, SimpleRelativeSingleField, SimpleRelativeSingleFieldProps, Stack, useFieldControl } from '../../../src'

export default function () {
	return (
		<Layout scheme="system">
			<CreatePage entity="Article">
				<Stack direction="vertical">
					<div tabIndex={1} id="deselected">Deselect by clicking here</div>
					<TitleSelectField
						required
						id="pw-title"
						label="Title"
						field="title"
					/>
				</Stack>
			</CreatePage>
		</Layout>
	)
}

type TitleSelectFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<string>

const parse: ControlValueParser<string, string> = value => value ?? null
const format: FieldValueFormatter<string, string> = value => value ?? null

const TitleSelectField = SimpleRelativeSingleField<TitleSelectFieldProps, string>(
	(fieldMetadata, {
		label,
		...props
	}) => {
		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse,
			format,
		})

		return <Select
			{...inputProps}
			options={[{
				label: 'Basic Article',
				value: 'Basic Article',
			}, {
				label: 'Special Article',
				value: 'Special Article',
			}, {
				label: 'Awesome Article',
				value: 'Awesome Article',
			}, {
				label: 'Random Article',
				value: 'Random Article',
			}]}
		/>
	},
	'TitleSelectField',
)
