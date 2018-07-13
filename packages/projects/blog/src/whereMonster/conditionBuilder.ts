import { escapeParameter, expression, quoteIdentifier } from "../sql/utils"
import { Condition } from "../schema/input";


const buildCondition = (tableName: string, columnName: string) => (condition: Condition<any>): string => {
  const parameters: any[] = []

  const buildParts = (condition: Condition<any>): string[] => {
    const parts = []
    if (condition.and !== undefined) {
      parts.push(expression.and(condition.and.map(it => expression.and(buildParts(it)))))
    }
    if (condition.or !== undefined) {
      parts.push(expression.or(condition.or.map(it => expression.and(buildParts(it)))))
    }
    if (condition.not !== undefined) {
      parts.push(expression.not(expression.and(buildParts(condition.not))))
    }

    const fqn = `${tableName}.${quoteIdentifier(columnName)}`

    if (condition.eq !== undefined) {
      parameters.push(condition.eq)
      parts.push(`${fqn} = ?`)
    }
    if (condition.null !== undefined) {
      const not = condition.null ? '' : 'NOT '
      parts.push(`${fqn} IS ${not}NULL`)
    }
    if (condition.notEq !== undefined) {
      parameters.push(condition.notEq)
      parts.push(`${fqn} != ?`)
    }
    if (condition.in !== undefined) {
      parameters.push(condition.in)
      parts.push(`${fqn} IN ?`)
    }
    if (condition.notIn !== undefined) {
      parameters.push(condition.in)
      parts.push(`${fqn} NOT IN ?`)
    }
    if (condition.lt !== undefined) {
      parameters.push(condition.lt)
      parts.push(`${fqn} < ?`)
    }
    if (condition.lte !== undefined) {
      parameters.push(condition.lt)
      parts.push(`${fqn} <= ?`)
    }
    if (condition.gt !== undefined) {
      parameters.push(condition.gt)
      parts.push(`${fqn} > ?`)
    }
    if (condition.gte !== undefined) {
      parameters.push(condition.gte)
      parts.push(`${fqn} >= ?`)
    }
    return parts
  }

  let i = 0
  return expression.and(buildParts(condition)).replace(/\?/g, () => {
    return escapeParameter(parameters[i++])
  })

}

export default buildCondition
