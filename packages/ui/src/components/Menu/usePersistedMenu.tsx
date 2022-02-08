import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react'
import { BrowserTabs, Storage } from '../../auxiliary'

interface UnpersistedMenu {
  menuId: string
  tabName: string
}

export type PersistedMenu = Set<string>

interface PersistedMenuApi {
  readonly key: string
  readonly expandedList: Set<string>
  readonly persistExpand: PersistOnExpand
  readonly persistCollapse: UnpersistOnCollapse
}

namespace MenuIndex {
  const LIST_KEY = '$$menus'
  const storage = new Storage

  function asSet(value: any): Set<string> {
    return value instanceof Set ? value : new Set<string>()
  }

  export function all(): Set<string> {
    return asSet(storage.get(LIST_KEY, new Set<string>()))
  }

  export function add(key: string) {
    const list = all()
    list.add(key)
    storage.set(LIST_KEY, list)
  }

  export function remove(key: string) {
    const list = all()
    list.delete(key)
    storage.set(LIST_KEY, list)
  }
}

namespace MenuList {
  const storage = new Storage

  export function expand(menuKey: string, expanded: string) {
    const menu = get(menuKey)

    if (menu) {
      if (menu.has(expanded)) {
        return menu
      }

      return set(menuKey, new Set(menu.add(expanded)))
    }
  }

  export function collapse(menuKey: string, collapsed: string) {
    const menu = get(menuKey)

    if (menu) {
      if (menu.has(collapsed)) {
        menu.delete(collapsed)
        return set(menuKey, new Set(menu))
      }

      return menu
    }
  }

  export function getKey({ menuId, tabName }: UnpersistedMenu) {
    return `${tabName}:::${menuId}`
  }

  export function set(key: string, menu: PersistedMenu): PersistedMenu {
    MenuIndex.add(key)

    return storage.set<PersistedMenu>(key, menu)
  }

  function asPersistedMenu(menu: any): PersistedMenu | undefined {
    if (menu instanceof Set) {
      return menu
    }
  }

  function get(key: string): PersistedMenu | undefined {
    const menu = asPersistedMenu(storage.get<PersistedMenu>(key))

    if (menu) {
      MenuIndex.add(key)
      return menu
    }

    // Cleanup
    storage.remove(key)
    MenuIndex.remove(key)
  }

  function create(key: string): PersistedMenu {
    return set(key, new Set<string>())
  }

  export function getOrCreate(key: string): PersistedMenu {
    return get(key) || create(key)
  }

  export function remove(key: string) {
    MenuIndex.remove(key)
    return storage.remove(key)
  }
}

type PersistOnExpand = (item: string) => void
type UnpersistOnCollapse = (item: string) => void

function persistedMenuFactory(unpersistedMenu: UnpersistedMenu): PersistedMenuApi {
  const key: string = MenuList.getKey(unpersistedMenu)

  const expandedList: PersistedMenu = MenuList.getOrCreate(key)

  return {
    key,
    expandedList,
    persistExpand: (expanded: string) => {
      MenuList.expand(key, expanded)
    },
    persistCollapse: (collapsed: string) => {
      MenuList.collapse(key, collapsed)
    },
  }
}

interface PersistedMenuContextProps {
  expandedList?: Set<string> | undefined
  onChangeFactory: (id: string) => (expanded: boolean) => void
}

const PersistedMenuContext = createContext<PersistedMenuContextProps>({
  expandedList: new Set<string>(),
  onChangeFactory: (id: string) => (expanded: boolean) => {},
})

export function PersistedMenuProvider({
  menuId,
  children,
}: {
  menuId: string | undefined,
  children?: ReactNode,
}) {
	const persistedMenu = useMemo(() => {
    if (!menuId) {
      return
    }

    const unpersistedMenu: UnpersistedMenu = {
      menuId,
      tabName: BrowserTabs.open().name,
    }

    const { key, expandedList, persistExpand, persistCollapse } = persistedMenuFactory(unpersistedMenu)

    return Object.freeze({
      key,
      expandedList,
      persistExpand,
      persistCollapse,
    })
  }, [menuId])

  const expandedList = persistedMenu?.expandedList
	const persistExpand = persistedMenu?.persistExpand
	const persistCollapse = persistedMenu?.persistCollapse

  return <PersistedMenuContext.Provider value={{
    expandedList,
    onChangeFactory: useCallback((id: string) => (expanded: boolean) => {
      if (expanded) {
        persistExpand?.(id)
      } else {
        persistCollapse?.(id)
      }
    }, [persistExpand, persistCollapse]),
  }}>
    {children}
  </PersistedMenuContext.Provider>
}

export function usePersistedMenuContext(id: string) {
  const { expandedList, onChangeFactory } = useContext(PersistedMenuContext)

  const initial = expandedList ? expandedList.has(id) : undefined
  const onExpandedChange = onChangeFactory(id)

  return useMemo(() => ({
    initial,
    onExpandedChange,
  }), [initial, onExpandedChange])
}
