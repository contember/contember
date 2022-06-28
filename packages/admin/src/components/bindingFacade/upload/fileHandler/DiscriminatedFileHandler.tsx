import { AcceptedFile, FileHandler, ResolvedFileEntity } from './FileHandler'
import { NormalizedDiscriminatedData } from '../../discrimination'
import {
	BindingError,
	EntityAccessor,
	Environment,
	HasOne,
	OptionallyVariableFieldValue,
	SugaredField,
	SugaredFieldProps,
	VariableInputTransformer,
} from '@contember/binding'
import { resolveAcceptingSingleKind } from './utils/resolveAccept'
import { resolveAllAcceptedMimes } from './utils/resolveAllAcceptedMimes'
import { Fragment, ReactElement } from 'react'
import { disconnectAtBase } from './utils/disconnectAtBase'
import { staticRenderFileKind } from './utils/staticRenderFileKind'
import { AcceptFileOptions, FullFileKind } from '../fileKinds'
import { AcceptFileKindError } from './AcceptFileKindError'

export class DiscriminatedFileHandler implements FileHandler {
	public readonly hasBaseEntity: boolean
	public readonly acceptedMimes: string[] | null

	constructor(
		private readonly discriminationField: SugaredFieldProps['field'],
		private readonly baseEntity: string | undefined,
		private readonly fileKinds: NormalizedDiscriminatedData<FullFileKind<any, any>>,
	) {
		this.hasBaseEntity = this.baseEntity !== undefined
		this.acceptedMimes = resolveAllAcceptedMimes(Array.from(fileKinds.values(), it => it.datum.acceptMimeTypes).flat())
	}

	async acceptFile(
		fileOptions: AcceptFileOptions,
	): Promise<AcceptedFile | undefined> {
		const errors = []
		for (const { datum: fileKind, discriminateBy } of this.fileKinds.values()) {
			try {
				const result = await resolveAcceptingSingleKind(fileOptions, fileKind)
				if (result !== undefined) {
					return {
						fileKind,
						finalizeEntity: entity => {
							DiscriminatedFileHandler.fillDiscriminateBy(entity, this.baseEntity, discriminateBy, this.discriminationField)
						},
					}
				}
			} catch (e) {
				if (e instanceof AcceptFileKindError) {
					errors.push(e)
				}
			}
		}
		if (errors.length) {
			throw new AggregateError(errors)
		} else {
			return undefined
		}
	}

	resolveEntity(parentEntity: EntityAccessor): ResolvedFileEntity {
		const containingEntity = this.getContainingEntity(parentEntity)
		const fileKind = this.resolveFileKind(parentEntity)
		if (!fileKind) {
			return {
				parentEntity,
				isEmpty: true,
				fileEntity: undefined,
				fileKind: undefined,
				getErrorHolders: () => {
					return [
						parentEntity,
						...(parentEntity == containingEntity ? [containingEntity] : []),
					]
				},
			}
		}

		const fileEntity = fileKind.baseEntity ? containingEntity.getEntity(fileKind.baseEntity) : containingEntity

		const baseEntity = this.baseEntity
		return {
			parentEntity,
			isEmpty: false,
			fileEntity,
			fileKind,
			destroy: baseEntity ? () => {
				disconnectAtBase(baseEntity, parentEntity)
			} : undefined,
			getErrorHolders: () => {
				return [
					parentEntity,
					...(containingEntity !== parentEntity ? [containingEntity] : []),
					...(fileEntity !== containingEntity ? [fileEntity] : []),
					...fileKind.extractors.flatMap(it => it.getErrorsHolders?.({
						entity: fileEntity,
						environment: fileEntity.environment,
					}) ?? []),
				]
			},
		}
	}

	staticRender(environment: Environment): ReactElement {
		const staticKinds = Array.from(this.fileKinds.values(), fileKind => staticRenderFileKind(fileKind.datum, environment))
		const childrenOutsideBase = <>
			{staticKinds.map(([, it], index) => <Fragment key={index}>{it}</Fragment>)}
		</>
		const children = (
			<>
				<SugaredField field={this.discriminationField} isNonbearing />
				{staticKinds.map(([children], i) => (
					<Fragment key={i}>{children}</Fragment>
				))}
			</>
		)
		return this.baseEntity === undefined
			? <>
				{children}
				{childrenOutsideBase}
			</>
			: <>
				{childrenOutsideBase}
				<HasOne field={this.baseEntity}>{children}</HasOne>
			</>
	}


	private resolveFileKind(parent: EntityAccessor): FullFileKind<any, any> | undefined {
		const containingEntity = this.getContainingEntity(parent)
		const discriminant = containingEntity.getField(this.discriminationField).value
		if (!discriminant) {
			return undefined
		}
		const fileKind = this.fileKinds.get(discriminant)
		if (!fileKind) {
			throw new BindingError(`Undefined file kind "${discriminant}".`)
		}
		return fileKind.datum
	}

	private getContainingEntity(accessor: EntityAccessor) {
		return this.baseEntity ? accessor.getEntity(this.baseEntity) : accessor
	}

	public static fillDiscriminateBy(
		entity: EntityAccessor,
		baseEntity: string | undefined,
		discriminateBy: OptionallyVariableFieldValue,
		discriminationField: SugaredFieldProps['field'],
	) {
		if (baseEntity !== undefined) {
			entity = entity.getEntity(baseEntity)
		}
		entity
			.getField(discriminationField)
			.updateValue(
				VariableInputTransformer.transformValue(discriminateBy, entity.environment),
			)
	}
}
