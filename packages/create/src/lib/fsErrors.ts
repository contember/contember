export const hasCode = (error: unknown, code: string): boolean => error instanceof Error && 'code' in error && error.code === code
export const isNotFound = (error: unknown): boolean => hasCode(error, 'ENOENT')
