import { EntityAccessor, EntityForRemovalAccessor, EntityListAccessor, FieldAccessor, RootAccessor } from '../accessors'
import { ReceivedDataTree, ReceivedEntityData } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { ConnectionMarker, EntityFields, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../markers'
import { ExpectedEntityCount } from '../treeParameters/primitives'
import { assertNever } from '../utils'

export class DirtinessChecker {
	private isDirtyCache: WeakMap<EntityAccessor | EntityListAccessor, boolean>

	public constructor(
		private readonly markerTree: MarkerTreeRoot,
		private readonly persistedData: ReceivedDataTree<undefined> | undefined,
	) {
		this.isDirtyCache = new WeakMap()
	}

	public isDirty(accessorTree: RootAccessor): boolean {
		const persistedData = this.persistedData ? this.persistedData[this.markerTree.id] : undefined

		if (
			Array.isArray(persistedData) ||
			(this.markerTree.parameters.type === 'unconstrained' && persistedData === undefined)
		) {
			if (accessorTree instanceof EntityListAccessor) {
				return this.isEntityListDirty(this.markerTree.fields, persistedData, accessorTree)
			}
		} else {
			if (accessorTree instanceof EntityAccessor || accessorTree instanceof EntityForRemovalAccessor) {
				return this.isEntityDirty(this.markerTree.fields, persistedData, accessorTree)
			}
		}
		this.rejectInvalidTree()
	}

	private isEntityDirty(
		fields: EntityFields,
		persistedData: ReceivedEntityData<undefined>,
		node: EntityAccessor | EntityForRemovalAccessor,
	): boolean {
		if (node instanceof EntityForRemovalAccessor) {
			return true
		}
		if (this.isDirtyCache.has(node)) {
			return this.isDirtyCache.get(node)!
		}

		let isEntityDirty = false
		entityFields: for (const placeholderName in fields) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}

			const marker = fields[placeholderName]

			if (marker instanceof FieldMarker) {
				const accessor = node.data[placeholderName]
				const persistedField = persistedData ? persistedData[placeholderName] : undefined

				if (marker.isNonbearing) {
					continue
				}
				if (!(accessor instanceof FieldAccessor)) {
					this.rejectInvalidTree()
				}

				let resolvedValue
				if (marker.defaultValue === undefined) {
					resolvedValue = accessor.currentValue
				} else {
					resolvedValue = accessor.currentValue === null ? marker.defaultValue : accessor.currentValue
				}
				const isPersisted = node.isPersisted()

				if (
					(isPersisted && persistedField !== resolvedValue) ||
					(!isPersisted && resolvedValue !== undefined && resolvedValue !== null)
				) {
					isEntityDirty = true
					break
				}
			} else if (marker instanceof ReferenceMarker) {
				const references = marker.references

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const accessor = node.data[reference.placeholderName]
					const persistedField = persistedData ? persistedData[reference.placeholderName] : undefined

					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (
							(accessor instanceof EntityAccessor || accessor instanceof EntityForRemovalAccessor) &&
							((persistedField !== null && typeof persistedField === 'object' && !Array.isArray(persistedField)) ||
								persistedField === undefined ||
								persistedField === null)
						) {
							const isDirty = this.isEntityDirty(reference.fields, persistedField || undefined, accessor)
							if (isDirty) {
								isEntityDirty = true
								break entityFields
							}
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (
							accessor instanceof EntityListAccessor &&
							(Array.isArray(persistedField) || persistedField === undefined || persistedField === null)
						) {
							const isDirty = this.isEntityListDirty(reference.fields, persistedField, accessor)
							if (isDirty) {
								isEntityDirty = true
								break entityFields
							}
						}
					} else {
						assertNever(reference.expectedCount)
					}
				}
			} else if (marker instanceof MarkerTreeRoot) {
				// Do nothing
			} else if (marker instanceof ConnectionMarker) {
				// Do nothing
			} else {
				assertNever(marker)
			}
		}
		this.isDirtyCache.set(node, isEntityDirty)
		return isEntityDirty
	}

	private isEntityListDirty(
		fields: EntityFields,
		persistedData: ReceivedEntityData<undefined>[] | undefined | null,
		accessor: EntityListAccessor,
	): boolean {
		let isDirty = false
		for (let i = 0, entityCount = accessor.entities.length; i < entityCount; i++) {
			const innerAccessor = accessor.entities[i]
			if (innerAccessor) {
				isDirty = this.isEntityDirty(fields, persistedData ? persistedData[i] : undefined, innerAccessor)
				if (isDirty) {
					break
				}
			}
		}
		this.isDirtyCache.set(accessor, isDirty)
		return isDirty
	}

	private rejectInvalidTree(): never {
		throw new BindingError(`Internally inconsistent data. This should never happen.`)
	}
}
