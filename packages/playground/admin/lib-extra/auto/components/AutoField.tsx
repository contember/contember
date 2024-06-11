// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Component, Field, Schema } from '@contember/react-binding'
import { MultiSelectField, SelectField } from '@contember/react-choice-field-ui'
import { CheckboxField, DateField, DateTimeField, FloatField, NumberField, TextareaField, TextField } from '@contember/react-form-fields-ui'
import { AutoFields } from './AutoFields'
import { AutoLabel } from './AutoLabel'
import { FieldContainer } from '@contember/ui'
import { getHumanFriendlyField } from '../utils/getHumanFriendlyField'
import { resolveSortableBy } from '../utils/resolveSortableBy'
import { resolveConnectingEntity } from '../utils/resolveConnectingEntity'
import { LinkComponent } from './types'

export type AutoFieldProps = {
	schema: Schema
	entityName: string
	fieldName: string
	LinkComponent?: LinkComponent
	excludedEntities?: string[]
}

/**
 * @group Auto Admin
 */
export const AutoField = Component<AutoFieldProps>(
	({ schema, entityName, fieldName, LinkComponent, excludedEntities }) => {
		const field = schema.getEntityField(entityName, fieldName)

		if (field.__typename === '_Column') {
			const common = {
				field: field.name,
				label: field.name,
				required: !field.nullable,
				defaultValue: field.defaultValue as any,
			}

			if (field.name === 'id') {
				return <TextField {...common} readOnly />

			} else if (field.type === 'String') {
				return <TextareaField {...common} minRows={1} />

			} else if (field.type === 'Uuid') {
				return <TextField {...common} />

			} else if (field.type === 'Bool') {
				return <CheckboxField {...common} />

			} else if (field.type === 'Integer') {
				return <NumberField {...common} />

			} else if (field.type === 'Double') {
				return <FloatField {...common} />

			} else if (field.type === 'Date') {
				return <DateField {...common} />

			} else if (field.type === 'DateTime') {
				return <DateTimeField {...common} />

			} else if (field.type === 'Enum') {
				const enumValues = schema.getEnumValues(field.enumName!)
				const options = enumValues.map(it => ({ value: it, label: it }))
				return <SelectField {...common} options={options} allowNull={field.nullable} />

			} else if (field.type === 'Json') {
				return <FieldContainer {...common}><Field field={field.name} format={it => <pre>{JSON.stringify(it)}</pre>} /></FieldContainer>

			} else {
				return <FieldContainer {...common}>Unsupported field type {field.type}</FieldContainer>
			}

		} else {
			const sortableBy = resolveSortableBy(schema, field)
			const connectingEntity = resolveConnectingEntity(schema, field, sortableBy)

			const targetField = connectingEntity ? connectingEntity.field : field
			const targetEntity = schema.getEntity(targetField.targetEntity)
			const humanFieldName = getHumanFriendlyField(targetEntity)
			const optionLabel = <AutoLabel field={humanFieldName} LinkComponent={LinkComponent} />
			const otherSide = targetField.side === 'owning' ? targetField.inversedBy : targetField.ownedBy
			const excludedFields = [otherSide, sortableBy].filter(it => it) as string[]

			const createNewForm = excludedEntities === undefined || !excludedEntities.includes(targetEntity.name)
				? <AutoFields excludedFields={excludedFields} excludedEntities={excludedEntities} LinkComponent={LinkComponent} />
				: undefined

			if (field.type === 'OneHasOne' || field.type === 'ManyHasOne') {
				return (
					<SelectField
						field={field.name}
						label={field.name}
						options={targetEntity.name}
						optionLabel={optionLabel}
						searchByFields={[humanFieldName]}
						createNewForm={createNewForm}
						allowNull={field.nullable === true}
						required={field.nullable !== true}
						lazy
					/>
				)

			} else {
				return (
					<MultiSelectField
						field={field.name}
						label={field.name}
						options={targetEntity.name}
						optionLabel={optionLabel}
						searchByFields={[humanFieldName]}
						sortableBy={sortableBy}
						createNewForm={createNewForm}
						connectingEntityField={connectingEntity ? connectingEntity.field.name : undefined}
						lazy
					/>
				)
			}
		}
	},
)
