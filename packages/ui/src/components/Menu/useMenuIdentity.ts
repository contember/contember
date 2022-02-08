import { Children, useEffect, useMemo, useState } from 'react'
import { MenuItemProps } from '.'
import type { MenuProps, MenuTreeNode } from './Types'

// See https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function sha256(message: string) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message)

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

function extractProps<T extends any = any>(children?: MenuItemProps<T>['children']): MenuTreeNode[] | undefined {
  if (!children) {
    return
  }

  return Children.map(children, ({ props }) => {
    const { children, ...rest } = props

    return children ? { ...rest, children: extractProps(children) } : rest
  })
}

export function useMenuIdentity<T extends any = any>({ id, children }: MenuProps<T>): string | undefined {
  const tree = useMemo(() => extractProps(id ? null : children), [id, children])
  const [treeHash, setChecksum] = useState<string | undefined>(id)

  useEffect(() => {
    if (id) {
      setChecksum(id)

      return
    }

    async function calculate() {
      const treeHash = await sha256(JSON.stringify(tree))
      setChecksum(treeHash)
    }

    calculate()
  }, [id, treeHash, tree])

  return useMemo(() => id || treeHash, [id, treeHash])
}
