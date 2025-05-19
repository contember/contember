import { Input, Model, Value } from '@contember/schema'
import { MapperInput } from './types'

export enum MutationResultType {
	ok = 'ok',
	nothingToDo = 'nothingToDo',
	notFoundError = 'notFoundError',
	constraintViolationError = 'constraintViolationError',
	noResultError = 'noResultError',
	validationError = 'validationError',
	inputError = 'inputError',
	sqlError = 'sqlError',
}

export enum MutationResultHint {
	sqlError = 'sqlError',
	subSequentSqlError = 'subsequentSqlError',
}

export enum ModificationType {
	create = 'create',
	update = 'update',
	delete = 'delete',
	junctionUpdate = 'junctionUpdate',
}

export type MutationResult =
	| MutationUpdateOk
	| MutationCreateOk
	| MutationDeleteOk
	| MutationJunctionUpdateOk
	| MutationEntryNotFoundError
	| MutationNothingToDo
	| MutationConstraintViolationError
	| MutationNoResultError
	| MutationInputError
	| MutationSqlError

export type MutationResultList = MutationResult[]

type Path = ({ field: string } | { index: number; alias?: string })[]

interface MutationResultInterface {
	error: boolean
	result: MutationResultType
	paths: Path[]
	message?: string
	hints: MutationResultHint[]
}

export type RowValues = { [fieldName: string]: Value.FieldValue }

export class MutationUpdateOk implements MutationResultInterface {
	error = false
	result = MutationResultType.ok as const
	type = ModificationType.update as const
	hints: MutationResultHint[] = []

	constructor(
		public readonly paths: Path[],
		public readonly entity: Model.Entity,
		public readonly primary: Value.PrimaryValue,
		public readonly input: MapperInput.UpdateDataInput,
		public readonly values: RowValues,
		public readonly oldValues?: RowValues,
	) {}
}

export class MutationCreateOk implements MutationResultInterface {
	error = false
	result = MutationResultType.ok as const
	type = ModificationType.create as const
	hints: MutationResultHint[] = []

	constructor(
		public readonly paths: Path[],
		public readonly entity: Model.Entity,
		public readonly primary: Value.PrimaryValue,
		public readonly input: MapperInput.CreateDataInput,
		public readonly values: RowValues,
	) {}
}

export class MutationDeleteOk implements MutationResultInterface {
	error = false
	result = MutationResultType.ok as const
	type = ModificationType.delete as const
	hints: MutationResultHint[] = []

	constructor(
		public readonly paths: Path[],
		public readonly entity: Model.Entity,
		public readonly primary: Value.PrimaryValue,
	) {}
}

export class MutationJunctionUpdateOk implements MutationResultInterface {
	error = false
	result = MutationResultType.ok as const
	type = ModificationType.junctionUpdate as const
	hints: MutationResultHint[] = []

	constructor(
		public readonly paths: Path[],
		public readonly entity: Model.Entity,
		public readonly relation: Model.ManyHasManyOwningRelation,
		public readonly owningUnique: Input.PrimaryValue,
		public readonly inverseUnique: Input.PrimaryValue,
	) {}
}

export enum NothingToDoReason {
	noData = 'noData',
	emptyRelation = 'emptyRelation',
	alreadyExists = 'alreadyExists',
	aborted = 'aborted',
	alreadyDeleted = 'alreadyDeleted',
}

export class MutationNothingToDo implements MutationResultInterface {
	error = false
	result = MutationResultType.nothingToDo as const
	hints: MutationResultHint[] = []

	constructor(public readonly paths: Path[], public readonly reason: NothingToDoReason) {}
}

export enum InputErrorKind {
	nonUniqueWhere = 'nonUniqueWhere',
	invalidData = 'invalidData',
}

export class MutationInputError implements MutationResultInterface {
	error = true
	result = MutationResultType.inputError as const

	constructor(
		public readonly paths: Path[],
		public readonly kind: InputErrorKind,
		public readonly message?: string,
		public readonly hints: MutationResultHint[] = [],
	) {}
}

export class MutationSqlError implements MutationResultInterface {
	error = true
	result = MutationResultType.sqlError as const

	constructor(
		public readonly paths: Path[],
		public readonly message?: string,
		public readonly hints: MutationResultHint[] = [],
	) {}
}

export enum ConstraintType {
	notNull = 'notNull',
	uniqueKey = 'uniqueKey',
	foreignKey = 'foreignKey',
}

export class MutationConstraintViolationError implements MutationResultInterface {
	error = true
	result = MutationResultType.constraintViolationError as const

	constructor(
		public readonly paths: Path[],
		public readonly constraint: ConstraintType,
		public readonly message?: string,
		public readonly hints: MutationResultHint[] = [],
	) {}
}

// maybe denied by acl
export class MutationEntryNotFoundError implements MutationResultInterface {
	error = true
	result = MutationResultType.notFoundError as const
	hints: MutationResultHint[] = []
	message: string

	constructor(public readonly paths: Path[], public readonly where: Input.UniqueWhere | Input.OptionalWhere) {
		this.message = 'for input ' + JSON.stringify(where)
	}
}

// possibly denied by acl
export class MutationNoResultError implements MutationResultInterface {
	error = true
	result = MutationResultType.noResultError as const

	constructor(
		public readonly paths: Path[],
		public readonly message?: string,
		public readonly hints: MutationResultHint[] = [],
	) {}
}

export const prependPath = (path: Path, results: MutationResultList): MutationResultList =>
	results.map(it => ({
		...it,
		paths: (it.paths.length === 0 ? [[]] : it.paths).map(it => [...path, ...it]),
	}))

export const getInsertPrimary = (result: MutationResultList) =>
	result[0] && result[0].result === MutationResultType.ok && result[0].type === ModificationType.create
		? result[0].primary
		: undefined
