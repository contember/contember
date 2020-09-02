import * as React from 'react'
import { LoginTokenContext } from './LoginTokenContext'

export const useLoginToken = () => React.useContext(LoginTokenContext)
