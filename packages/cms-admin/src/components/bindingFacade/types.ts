import { Input } from '@contember/schema'
import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import {
	ErrorAccessor,
	Filter,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	Scalar,
	VariableInput,
} from '../../binding'

export type RelativeLabelPosition = 'top' | 'left' | 'right'

export type RemovalType = 'disconnect' | 'delete'

export interface StaticFormNodeProps {
	label: React.ReactNode

	labelPosition?: RelativeLabelPosition
	labelDescription?: React.ReactNode
}

export interface DynamicFormNodeProps extends StaticFormNodeProps {
	errors: ErrorAccessor[]
	description?: React.ReactNode
}

export interface ReferenceFormNodeProps extends DynamicFormNodeProps {
	filter?: string | Filter
	removalType?: RemovalType
	canRemove?: boolean
}

export interface SingleReferenceFormNodeProps extends ReferenceFormNodeProps {
	field: RelativeSingleEntity
}

export interface CollectionFormNodeProps extends ReferenceFormNodeProps {
	field: RelativeEntityList

	orderBy?: Input.OrderBy<CrudQueryBuilder.OrderDirection>[]
	offset?: number
	limit?: number
	canRemoveAll?: boolean
	canAddNew?: boolean
}

export interface FieldFormNodeProps<
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> extends DynamicFormNodeProps {
	field: RelativeSingleField

	defaultValue?: VariableInput | Produced

	// TODO some size control
}
