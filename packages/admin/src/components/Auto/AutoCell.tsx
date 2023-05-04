import { Component, HasOne, PRIMARY_KEY_NAME, Schema, useEntityPersistSuccess } from '@contember/binding'
import {
	BooleanCell,
	CheckboxField,
	DateCell,
	DateField,
	DateTimeField,
	EnumCell,
	HasManySelectCell,
	HasOneSelectCell,
	NumberCell,
	NumberField,
	SelectField,
	TextareaField,
	TextCell,
	TextField,
} from '../bindingFacade'
import { formatString, getHumanFriendlyField, resolveConnectingEntity, resolveSortableBy } from './utils'
import { MouseEvent, ReactNode, useCallback, useRef, useState } from 'react'
import { RoutingLinkTarget } from '../../routing'
import { dateToStringWithoutTimezone } from '../../utils'
import { AutoLabel } from './AutoLabel'

export type AutoCellProps = {
	schema: Schema
	entityName: string
	fieldName: string
	createEntityLink?: (entity: string) => RoutingLinkTarget
}

/**
 * @group Auto Admin
 */
export const AutoCell = Component<AutoCellProps>(
	({ schema, entityName, fieldName, createEntityLink }) => {
		const field = schema.getEntityField(entityName, fieldName)

		if (field.__typename === '_Column') {
			if (field.name === PRIMARY_KEY_NAME) {
				return (
					<TextCell
						header={field.name}
						field={field.name}
						shrunk
						format={it => formatString(field.type, it)}
					/>
				)

			} else if (field.type === 'String') {
				return (
					<TextCell
						header={field.name}
						field={field.name}
						format={it => (
							<ClickToEdit
								view={formatString(field.type, it)}
								edit={<TextareaField field={field.name} label={undefined} minRows={1} size="small" />}
							/>
						)}
					/>
				)

			} else if (field.type === 'Uuid') {
				return (
					<TextCell
						header={field.name}
						field={field.name}
						format={it => (
							<ClickToEdit
								view={formatString(field.type, it)}
								edit={<TextField field={field.name} label={undefined} size="small" />}
							/>
						)}
					/>
				)

			} else if (field.type === 'Bool') {
				return (
					<BooleanCell
						header={field.name}
						field={field.name}
						format={it => (
							<ClickToEdit
								view={it ? '✓' : '✗'}
								edit={<CheckboxField field={field.name} label={undefined} />}
							/>
						)}
					/>
				)

			} else if (field.type === 'Enum') {
				const enumValues = schema.getEnumValues(field.enumName!)

				return (
					<EnumCell
						header={field.name}
						field={field.name}
						options={Object.fromEntries(enumValues.map(it => [it, it]))}
						format={it => (
							<ClickToEdit
								view={it}
								edit={<SelectField field={field.name} label={undefined} options={enumValues.map(it => ({ value: it, label: it }))} />}
							/>
						)}
					/>
				)

			} else if (field.type === 'Integer' || field.type === 'Double') {
				return (
					<NumberCell
						header={field.name}
						field={field.name}
						format={it => (
							<ClickToEdit
								view={it}
								edit={<NumberField field={field.name} label={undefined} size="small" />}
							/>
						)}
					/>
				)

			} else if (field.type === 'Date') {
				return (
					<DateCell
						header={field.name}
						field={field.name}
						format={it => (
							<ClickToEdit
								view={dateToStringWithoutTimezone(it, { includeTime: false })}
								edit={<DateField field={field.name} label={undefined} />}
							/>
						)}
					/>
				)

			} else if (field.type === 'DateTime') {
				return (
					<DateCell
						header={field.name}
						field={field.name}
						format={it => (
							<ClickToEdit
								view={dateToStringWithoutTimezone(it, { includeTime: true })}
								edit={<DateTimeField field={field.name} label={undefined} />}
							/>
						)}
					/>
				)

			} else {
				return <></>
			}

		} else {
			const sortableBy = resolveSortableBy(schema, field)
			const connectingEntity = resolveConnectingEntity(schema, field, sortableBy)

			const targetField = connectingEntity ? connectingEntity.field : field
			const targetEntity = schema.getEntity(targetField.targetEntity)
			const humanFieldName = getHumanFriendlyField(targetEntity)
			let optionLabel = <AutoLabel field={humanFieldName} createLink={createEntityLink} />
			optionLabel = connectingEntity ? <HasOne field={connectingEntity.field.name}>{optionLabel}</HasOne> : optionLabel

			if (field.type === 'OneHasOne' || field.type === 'ManyHasOne') {
				return (
					<HasOneSelectCell
						key={field.name}
						header={field.name}
						field={field.name}
						options={field.targetEntity}
						searchByFields={[humanFieldName]}
						optionLabel={optionLabel}
					/>
				)

			} else {
				return (
					<HasManySelectCell
						key={field.name}
						header={field.name}
						field={field.name}
						options={field.targetEntity}
						searchByFields={[connectingEntity ? `${connectingEntity.field.name}.${humanFieldName}` : humanFieldName]}
						optionLabel={optionLabel}
					/>
				)
			}
		}
	},
)

const ClickToEdit = Component<{ view: ReactNode, edit: ReactNode }>(
	props => {
		const [edit, setEdit] = useState(false)
		const onClick = useCallback((e: MouseEvent) => e.ctrlKey && setEdit(true), [])
		useEntityPersistSuccess(() => setEdit(false))

		return edit ? <>{props.edit}</> : <div onClick={onClick}>{props.view}</div>
	},
	props => (
		<>
			{props.edit}
			{props.view}
		</>
	),
)
