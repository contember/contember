import { Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper.js'
import { UpdateInputProcessor } from '../../../inputProcessing/index.js'
import { MutationResult, MutationResultList, prependPath } from '../../Result.js'
import { CheckedPrimary } from '../../CheckedPrimary.js'
import { MapperInput } from '../../types.js'
import { SqlUpdateInputProcessorResult } from '../SqlUpdateInputProcessor.js'
import { ImplementationException } from '../../../exception.js'

type HasManyContext =
	| Model.OneHasManyContext
	| Model.ManyHasManyOwningContext
	| Model.ManyHasManyInverseContext

/**
 * The subset of {@link UpdateInputProcessor.HasManyRelationInputProcessor} methods reused by `set`.
 * Each method returns either a result list or a thunk that finalizes once the owner primary is known.
 */
interface SetCapableProcessor<Context> {
	connect(context: Context & { input: Input.UniqueWhere | CheckedPrimary; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	create(context: Context & { input: MapperInput.CreateDataInput; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	connectOrCreate(
		context: Context & { input: MapperInput.ConnectOrCreateInput; index: number; alias?: string },
	): Promise<SqlUpdateInputProcessorResult>
	update(context: Context & { input: UpdateInputProcessor.UpdateManyInput; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	upsert(context: Context & { input: UpdateInputProcessor.UpsertManyInput; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	disconnect(context: Context & { input: Input.UniqueWhere; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
	delete(context: Context & { input: Input.UniqueWhere; index: number; alias?: string }): Promise<SqlUpdateInputProcessorResult>
}

const runStep = async (result: SqlUpdateInputProcessorResult, primary: Input.PrimaryValue): Promise<MutationResultList> => {
	return typeof result === 'function' ? await result({ primary }) : await result
}

/**
 * `update` and `upsert` on a oneHasMany resolve their `by` *within* the collection - the processor
 * completes the where with the owner, which is what lets a partial composite unique key (say
 * `unique(['locale', 'post'])` addressed by `{locale}` alone) identify a row. Resolving such a
 * where globally would fail as non-unique, so the lookup has to be scoped the same way.
 * Every other lookup - and every lookup on a junction relation - is global, again matching the
 * processor it feeds.
 */
const scopeToOwner = <Context extends HasManyContext>(
	context: Context,
	ownerPrimary: Input.PrimaryValue,
	where: Input.UniqueWhere,
): Input.UniqueWhere => {
	if (context.type !== 'oneHasMany') {
		return where
	}
	return { ...where, [context.targetRelation.name]: { [context.entity.primary]: ownerPrimary } }
}

/**
 * Implements the declarative `set` operation for has-many relations.
 *
 * Runs in three phases:
 *
 * 1. resolve which of the current members the input names, without writing anything;
 * 2. remove the members it does not name, according to `orphanStrategy`;
 * 3. connect/create/update the members it does name.
 *
 * Removal comes first so that the old and the new row never coexist: a unique key that includes
 * the owner - `unique(['locale', 'post'])`, the "replace all translations" shape this operation
 * exists for - would otherwise be violated by the intermediate state. Phase 1 writes nothing, so
 * a member named by the input is never removed and re-added; and a record created in phase 3
 * cannot be an orphan, because orphans come from a snapshot taken before it existed.
 */
export const processSetManyRelationInput = async <Context extends HasManyContext>(
	mapper: Mapper,
	context: Context,
	ownerPrimary: Input.PrimaryValue,
	processor: SetCapableProcessor<Context>,
	input: UpdateInputProcessor.SetManyInput,
): Promise<MutationResultList> => {
	const { targetEntity } = context
	const results: MutationResultList = []
	const desiredPrimaries = new Set<string>()

	const markDesired = (primary: Input.PrimaryValue | undefined) => {
		if (primary !== undefined && primary !== null) {
			desiredPrimaries.add(String(primary))
		}
	}
	const itemPath = (index: number, alias?: string) => [{ index, alias }]
	const fail = (index: number, alias: string | undefined, err: MutationResult): MutationResultList => {
		return [...results, ...prependPath(itemPath(index, alias), [err])]
	}

	const currentPrimaries = await mapper.fetchHasManyPrimaries(context, ownerPrimary)

	// Phase 1 - which current members does the input name? `create` never names one, and a target
	// that does not exist yet is not a member either, so both simply leave the set unmarked.
	const connectTargets: CheckedPrimary[] = []
	for (const [index, item] of input.items.entries()) {
		if ('connect' in item) {
			const [primary, err] = await mapper.getPrimaryValue(targetEntity, item.connect)
			if (err) {
				return fail(index, item.alias, err)
			}
			connectTargets[index] = new CheckedPrimary(primary)
			markDesired(primary)
		} else if ('update' in item) {
			const [primary, err] = await mapper.getPrimaryValue(targetEntity, scopeToOwner(context, ownerPrimary, item.update.by))
			if (err) {
				return fail(index, item.alias, err)
			}
			markDesired(primary)
		} else if ('upsert' in item) {
			// A missing target is not an error here - the processor falls back to creating it.
			const [primary] = await mapper.getPrimaryValue(targetEntity, scopeToOwner(context, ownerPrimary, item.upsert.by))
			markDesired(primary)
		} else if ('connectOrCreate' in item) {
			const [primary] = await mapper.getPrimaryValue(targetEntity, item.connectOrCreate.connect)
			markDesired(primary)
		} else if (!('create' in item)) {
			throw new ImplementationException('Unknown "set" item operation; the input visitor should have rejected it.')
		}
	}

	// Phase 2 - remove the members the input does not name.
	for (const current of currentPrimaries) {
		if (desiredPrimaries.has(String(current))) {
			continue
		}
		const where: Input.UniqueWhere = { [targetEntity.primary]: current }
		const orphanResult = input.orphanStrategy === Input.OrphanRemovalStrategy.delete
			? await runStep(await processor.delete({ ...context, input: where, index: 0, alias: undefined }), ownerPrimary)
			: await runStep(await processor.disconnect({ ...context, input: where, index: 0, alias: undefined }), ownerPrimary)
		results.push(...orphanResult)
		if (orphanResult.some(it => it.error)) {
			return results
		}
	}

	// Phase 3 - establish the members the input does name.
	for (const [index, item] of input.items.entries()) {
		const alias = item.alias
		let stepResult: MutationResultList
		if ('connect' in item) {
			stepResult = await runStep(
				await processor.connect({ ...context, input: connectTargets[index], index, alias }),
				ownerPrimary,
			)
		} else if ('create' in item) {
			stepResult = await runStep(await processor.create({ ...context, input: item.create, index, alias }), ownerPrimary)
		} else if ('connectOrCreate' in item) {
			stepResult = await runStep(await processor.connectOrCreate({ ...context, input: item.connectOrCreate, index, alias }), ownerPrimary)
		} else if ('update' in item) {
			stepResult = await runStep(
				await processor.update({ ...context, input: { where: item.update.by, data: item.update.data }, index, alias }),
				ownerPrimary,
			)
		} else if ('upsert' in item) {
			stepResult = await runStep(
				await processor.upsert({
					...context,
					input: { where: item.upsert.by, update: item.upsert.update, create: item.upsert.create },
					index,
					alias,
				}),
				ownerPrimary,
			)
		} else {
			throw new ImplementationException('Unknown "set" item operation; the input visitor should have rejected it.')
		}
		results.push(...prependPath(itemPath(index, alias), stepResult))
		if (stepResult.some(it => it.error)) {
			return results
		}
	}

	return results
}
