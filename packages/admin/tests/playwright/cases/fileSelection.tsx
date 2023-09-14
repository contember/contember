import { Component, EntityAccessor, EntityId, Field, StaticRender, useEntity } from '@contember/react-binding'
import { Card, LinkCardProps } from '@contember/ui'
import { useCallback, useMemo } from 'react'
import { CreatePage, DataGrid, EditPage, FileSelectionProps, GenericCell, ImageUploadField, Layout, TextCell } from '../../../src'

export default function () {
	return (
		<Layout scheme="system">
			<CreatePage entity="Upload">
				<ImageUploadField
					label="Image"
					baseEntity="image"
					fileSelectionComponent={ImageSelectForm}
					urlField="url"
					widthField="width"
					heightField="height"
					fileSizeField="size"
					fileTypeField="type"
				/>
			</CreatePage>
		</Layout>
	)
}

const ImageSelectForm = Component((
	{
		onToggleSelect,
		selectedEntityIds,
	}: FileSelectionProps) => (
	<DataGrid
		itemsPerPage={12}
		entities={'Image'}
		tile={<DataGridTile
			selectedEntityIds={selectedEntityIds}
			thumbnailField="url"
			onClick={onToggleSelect}
		/>}
		tileSize={260}
		selectedEntityIds={selectedEntityIds}
		onEntityClick={onToggleSelect}
	>
		<TextCell field="url" header="URL" />
		<GenericCell>
			<StaticRender>
				<Field field={'size'} />
				<Field field={'type'} />
				<Field field={'width'} />
				<Field field={'height'} />
			</StaticRender>
		</GenericCell>
	</DataGrid>
))


type DataGridTileProps =
	& Omit<LinkCardProps, 'src' | 'title' | 'href' | 'active' | 'onClick'>
	& {
		thumbnailField: string
		onClick?: (entity: EntityAccessor) => void
		selectedEntityIds?: EntityId[]
	}

export const DataGridTile = Component((props: DataGridTileProps) => {
	const entityAccessor = useEntity()

	const src = entityAccessor.getField<string>(props.thumbnailField).value
	const active = useMemo(() => props.selectedEntityIds?.includes(entityAccessor.id), [entityAccessor.id, props.selectedEntityIds])

	const { onClick } = props

	const onEntityClick = useCallback(() => {
		onClick?.(entityAccessor)
	}, [entityAccessor, onClick])

	return <Card
		onClick={onEntityClick}
		src={src}
		active={active}
	/>
}, ({ thumbnailField }) => <>
	<Field field={thumbnailField} />
</>,
)
DataGridTile.displayName = 'DataGridTile'
