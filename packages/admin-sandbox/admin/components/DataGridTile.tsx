import {
	Card,
	Component,
	EntityAccessor,
	EntityId,
	Field,
	Link,
	LinkCard,
	LinkCardProps,
	LinkProps,
	useEntity,
} from '@contember/admin'
import { useCallback, useMemo } from 'react'

type DataGridTileProps =
	& Omit<LinkCardProps, 'src' | 'title' | 'href' | 'active' | 'onClick'>
	& Partial<Pick<LinkProps, 'to'>>
	& {
		thumbnailField?: string
		titleField?: string
		onClick?: (entity: EntityAccessor) => void
		selectedEntityIds?: EntityId[]
	}

export const DataGridTile = Component((props: DataGridTileProps) => {
	const entityAccessor = useEntity()

	const src = props.thumbnailField ? entityAccessor.getField<string>(props.thumbnailField).value : null
	const title = props.titleField ? entityAccessor.getField<string>(props.titleField).value : props.children
	const active = useMemo(() => props.selectedEntityIds?.includes(entityAccessor.id), [entityAccessor.id, props.selectedEntityIds])
	const componentProps = useMemo(() => ({ active, src }), [active, src])

	const {
		onClick,
		thumbnailField,
		titleField,
		to,
		...rest
	} = props

	const onEntityClick = useCallback(() => {
		onClick?.(entityAccessor)
	}, [entityAccessor, onClick])

	return to
		? <Link
			{...rest}
			Component={LinkCard}
			componentProps={componentProps}
			to={to}
			children={title}
			onClick={onEntityClick}
		/>
		: <Card
			onClick={onEntityClick}
			src={src}
			active={active}
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
