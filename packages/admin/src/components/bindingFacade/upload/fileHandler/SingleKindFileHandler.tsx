import { AcceptedFile, FileHandler, ResolvedFileEntity } from './FileHandler'
import { resolveAcceptingSingleKind } from './utils/resolveAccept'
import { EntityAccessor, Environment, SugaredFieldProps } from '@contember/react-binding'
import { ReactElement } from 'react'
import { disconnectAtBase } from './utils/disconnectAtBase'
import { staticRenderFileKind } from './utils/staticRenderFileKind'
import { AcceptFileOptions, FullFileKind } from '../fileKinds'

export const isEmptyByUrlField = (urlField: SugaredFieldProps['field']) =>
	(accessor: EntityAccessor) =>
		accessor.getField(urlField).value === null

export class SingleKindFileHandler implements FileHandler {
	public readonly hasBaseEntity: boolean

	constructor(
		private kind: FullFileKind<any, any>,
		private isEmpty: (accessor: EntityAccessor) => boolean,
	) {
		this.hasBaseEntity = kind.baseEntity !== undefined
	}

	get acceptedMimes() {
		return this.kind.acceptMimeTypes
	}

	async acceptFile(
		fileOptions: AcceptFileOptions,
	): Promise<AcceptedFile | undefined> {
		const result = await resolveAcceptingSingleKind(fileOptions, this.kind)
		if (result) {
			return {
				fileKind: this.kind,
			}
		}
		return undefined
	}

	staticRender(environment: Environment): ReactElement {
		const [upload, outsideChildren] = staticRenderFileKind(this.kind, environment)
		return <>{upload}{outsideChildren}</>
	}

	resolveEntity(parentEntity: EntityAccessor): ResolvedFileEntity {
		const fileEntity = this.resolveFileEntity(parentEntity)
		const baseEntity = this.kind.baseEntity
		return {
			parentEntity,
			fileEntity,
			fileKind: this.kind,
			isEmpty: this.isEmpty(fileEntity),
			destroy: baseEntity ? () => {
				disconnectAtBase(baseEntity, parentEntity)
			} : undefined,
			getErrorHolders: () => {
				return [
					parentEntity,
					...(fileEntity !== parentEntity ? [fileEntity] : []),
					...this.kind.extractors.flatMap(it => it.getErrorsHolders?.({
						entity: fileEntity,
						environment: fileEntity.environment,
					}) ?? []),
				]
			},
		}
	}

	private resolveFileEntity(accessor: EntityAccessor) {
		return this.kind.baseEntity ? accessor.getEntity(this.kind.baseEntity) : accessor
	}
}
