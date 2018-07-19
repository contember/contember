import { ColumnValue, GenericValueLike } from "../schema/input"

export const resolveValue = <T extends ColumnValue>(value: GenericValueLike<T>): PromiseLike<T> => {
  if (typeof value === "function") {
    value = value()
  }
  return Promise.resolve(value)
}

export const escapeParameter = (val: ColumnValue): string => {
  if (val === null) {
    return "NULL"
  }

  if (typeof val === "number") {
    return val.toString()
  }

  if (typeof val === "boolean") {
    return val ? "TRUE" : "FALSE"
  }

  if (Array.isArray(val)) {
    const vals = val.map(escapeParameter)
    return "(" + vals.join(", ") + ")"
  }

  if (typeof val === "object") {
    return escapeParameter(JSON.stringify(val))
  }

  const backslash = ~val.indexOf("\\")
  const prefix = backslash ? "E" : ""
  const escaped = val.replace(/'/g, "''").replace(/\\/g, "\\\\")

  return prefix + "'" + escaped + "'"
}

export const quoteIdentifier = (...identifier: string[]): string => {
  return identifier.map(it => it.replace(/"/g, '""')).map(it => `"${it}"`).join(".")
}

const joinParts = (parts: string[], using: "AND" | "OR"): string => {
  if (parts.length === 0) {
    return ""
  }
  if (parts.length === 1) {
    return parts[0]
  }
  return "(" + parts.join(` ${using} `) + ")"
}

export const expression = {
  and: (parts: string[]): string => {
    return joinParts(parts, "AND")
  },
  or: (parts: string[]): string => {
    return joinParts(parts, "OR")
  },
  not: (expression: string): string => {
    return `NOT(${expression})`
  },
}

export const createAlias = (usedNames: string[]) => (...namePath: string[]): string => {
  let name = namePath.join("_")
  while (usedNames.includes(name)) {
    name += "_"
  }
  return name
}
