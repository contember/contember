const joinParts = (parts: string[], using: 'AND' | 'OR', not?: boolean) => {
  if (parts.length === 0) {
    return ''
  }
  if (!not && parts.length === 1) {
    return parts[0]
  }
  return (not ? 'NOT' : '') + '(' + parts.join(` ${using} `) + ')'
}

export { joinParts };
