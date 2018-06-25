import { joinParts } from "./utils";

export interface Condition<T>
{
  and?: Condition<T>[],
  or?: Condition<T>[],
  not?: Condition<T>,

  eq?: T,
  null?: boolean,
  notEq?: T,
  in?: T[],
  notIn?: T[],
  lt?: T,
  lte?: T,
  gt?: T,
  gte?: T,
}

const literal = (val: any): string => {
  if (null == val) return 'NULL';
  if (Array.isArray(val)) {
    const vals = val.map(literal)
    return "(" + vals.join(", ") + ")"
  }

  const backslash = ~val.indexOf('\\');
  const prefix = backslash ? 'E' : '';
  const escaped = val.replace(/'/g, "''").replace(/\\/g, '\\\\');
  return prefix + "'" + escaped + "'";
}


const buildCondition = (tableName: string, columnName: string) => (condition: Condition<any>): string => {
  const parameters: any[] = []

  const buildParts = (condition: Condition<any>): string[] => {
    const parts = []
    if (condition.and !== undefined) {
      parts.push(joinParts(condition.and.map(it => joinParts(buildParts(it), 'AND')), 'AND'))
    }
    if (condition.or !== undefined) {
      parts.push(joinParts(condition.or.map(it => joinParts(buildParts(it), 'AND')), 'OR'))
    }
    if (condition.not !== undefined) {
      parts.push(joinParts(buildParts(condition.not), 'AND', true))
    }

    const fqn = `${tableName}.${columnName}`

    if (condition.eq !== undefined) {
      parameters.push(condition.eq)
      parts.push(`${fqn} = ?`)
    }
    if (condition.null !== undefined) {
      const not = condition.null ? '' : 'NOT ';
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
  return joinParts(buildParts(condition), 'AND').replace(/\?/g, () => {
    return literal(parameters[i++])
  })

}

export default buildCondition
