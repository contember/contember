import {
	Component,
	Field,
	Link,
	LinkCard,
	LinkCardProps,
	LinkProps,
	useEntity,
} from '@contember/admin'

type DataGridTileProps =
	& Omit<LinkCardProps, 'src' | 'title' | 'href' | 'active' | 'onClick'>
	& Pick<LinkProps, 'to'>
	& {
		thumbnailField?: string
		titleField?: string
	}

export const DataGridTile = Component((props: DataGridTileProps) => {
	const entityAccessor = useEntity()

	const src = props.thumbnailField ? entityAccessor.getField<string>(props.thumbnailField).value : null
	const title = props.titleField ? entityAccessor.getField<string>(props.titleField).value : null

	const {
		thumbnailField,
		titleField,
		to,
		...rest
	} = props

	return <Link
		{...rest}
		Component={LinkCard}
		componentProps={{ src }}
		to={to}
		children={title}
	/>
}, ({
	thumbnailField,
	titleField,
}) => <>
	{thumbnailField && <Field field={thumbnailField} />}
	{titleField && <Field field={titleField} />}
</>,
)
DataGridTile.displayName = 'DataGridTile'
