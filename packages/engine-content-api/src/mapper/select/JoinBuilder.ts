import { Path } from './Path.js'
import { acceptRelationTypeVisitor, getTargetEntity } from '@contember/schema-utils'
import { Model } from '@contember/schema'
import { JoinDefinition, JoinVisitor } from './JoinVisitor.js'
import { Compiler, Literal, Operator, SelectBuilder, wrapIdentifier } from '@contember/database'

export class JoinBuilder {
	constructor(private readonly schema: Model.Schema) {}

	join<R extends SelectBuilder.Result>(
		qb: SelectBuilder<R>,
		path: Path,
		entity: Model.Entity,
		relationName: string,
		targetSource?: Literal,
	): SelectBuilder<R> {
		const targetEntity = getTargetEntity(this.schema, entity, relationName)
		if (!targetEntity) {
			throw new Error(`JoinBuilder: target entity for relation ${entity.name}::${relationName} not found`)
		}

		const joins = acceptRelationTypeVisitor(this.schema, entity, relationName, new JoinVisitor(path))
		const sources = this.createGuardedSources(joins, path, targetSource)

		return joins.reduce<SelectBuilder<R>>((qb, join, index) => {
			const targetAlias = join.targetAlias || path.alias
			if (qb.options.join.find(it => it.alias === targetAlias)) {
				return qb
			}
			const sourceAlias = join.sourceAlias || path.back().alias

			return qb.leftJoin(
				sources[index] ?? join.tableName,
				targetAlias,
				clause => clause.compareColumns([sourceAlias, join.sourceColumn], Operator.eq, [targetAlias, join.targetColumn]),
			)
		}, qb)
	}

	/**
	 * A guarded target source (a derived table restricted to readable rows) replaces the target table. Across a
	 * junction it guards the junction instead: a junction row pointing to an unreadable target must be absent too,
	 * or its null-extended target row would tell it apart from a relation without that row.
	 */
	private createGuardedSources(joins: readonly JoinDefinition[], path: Path, targetSource: Literal | undefined): (Literal | undefined)[] {
		if (targetSource === undefined) {
			return []
		}
		if (joins.length === 1) {
			return [targetSource]
		}
		const [junction, target] = joins
		const junctionAlias = junction.targetAlias ?? path.alias
		const targetAlias = target.targetAlias ?? path.alias
		const readableTarget = SelectBuilder.create()
			.select(expr => expr.raw('1'))
			.from(targetSource, targetAlias)
			.where(clause => clause.columnsEq([targetAlias, target.targetColumn], [junctionAlias, target.sourceColumn]))
		const query = SelectBuilder.create()
			.select(expr => expr.raw(`${wrapIdentifier(junctionAlias)}.*`))
			.from(junction.tableName, junctionAlias)
			.where(clause => clause.exists(readableTarget))
			.createQuery(new Compiler.Context(Compiler.SCHEMA_PLACEHOLDER, new Set()))
		return [new Literal(`(${query.sql})`, query.parameters), undefined]
	}
}
