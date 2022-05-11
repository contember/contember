import { Component, Field, useEntity } from '@contember/binding'
import { Card, CardProps, CheckboxButtonProps, LinkCard, LinkCardProps } from '@contember/ui'
import { ComponentType } from 'react'
import { Link, LinkProps } from '../../../../../routing'

type CommonDataGridTileProps =
	& {
		checked?: boolean
		thumbnailField?: string
		titleField?: string
	}
	& Partial<Omit<CheckboxButtonProps, 'active' | 'type'>>

type LinkableDataGridTileProps = & CommonDataGridTileProps
	& Omit<LinkCardProps, 'src' | 'title' | 'href' | 'active' | 'onClick'>
	& Pick<LinkProps, 'to'>
	& {
		CardComponent?: ComponentType<LinkCardProps>
	}

type NotLinkableDataGridTileProps =
	& CommonDataGridTileProps
	& Omit<CardProps, 'src' | 'title' | 'href' | 'active' | 'onClick'>
	& {
		to?: never
		CardComponent?: ComponentType<CardProps>
	}

export type DataGridTileProps =
	| LinkableDataGridTileProps
	| NotLinkableDataGridTileProps

export const DataGridTile = Component((props: DataGridTileProps) => {
	const entityAccessor = useEntity()

	const src = props.thumbnailField ? entityAccessor.getField<string>(props.thumbnailField).value : null
	const title = props.titleField ? entityAccessor.getField<string>(props.titleField).value : null

	if (props.to) {
		const {
			thumbnailField,
			titleField,
			to,
			CardComponent = LinkCard as ComponentType<LinkCardProps>,
			...rest
		} = props

		return <Link
			{...rest}
			Component={CardComponent}
			componentProps={{ src }}
			to={to}
			children={title}
		/>
	} else {
		const {
			thumbnailField,
			titleField,
			to,
			CardComponent: _CardComponent,
			...rest
		} = props as NotLinkableDataGridTileProps

		const CardComponent = _CardComponent as ComponentType<CardProps> ?? Card

		return <CardComponent
			{...rest}
			src={src}
		>{title}</CardComponent>
	}
}, ({
	thumbnailField,
	titleField,
}) => <>
	{thumbnailField && <Field field={thumbnailField} />}
	{titleField && <Field field={titleField} />}
</>,
)
DataGridTile.displayName = 'DataGridTile'
