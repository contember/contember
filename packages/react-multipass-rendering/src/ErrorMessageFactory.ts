import * as React from 'react'

export type ErrorMessageFactory = string | ((node: React.ReactNode) => string)
