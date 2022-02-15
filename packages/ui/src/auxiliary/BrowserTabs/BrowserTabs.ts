import { Storage } from '../LocalStorage'

const randomId = () => (Math.random() + 1).toString(36).substring(7)

const RECENTLY_CLOSED_TTL = 5000

interface BrowserTab {
  name: string
  createdAt: number
  updatedAt: number
  closedAt: null | number
}

interface TabsMap {
  [key: string]: BrowserTab
}

export namespace BrowserTabs {
  const ALL = '$$tabs'
  const storage = new Storage

  function asTab(value: any): BrowserTab | undefined {
    if (typeof value?.name === 'string'
      && typeof value?.createdAt === 'number'
      && typeof value?.updatedAt === 'number'
      && (typeof value?.closedAt === 'number' || value?.closedAt === null)
    ) {
      return value as BrowserTab
    }
  }

  function asTabsMap(value: any): TabsMap {
    if (typeof value !== 'object') {
      return {}
    }

    const entries: [string, BrowserTab][] = []

    Object.entries(value).forEach(([key, entry]) => {
      const tab = asTab(entry)
      if (tab) {
        entries.push([key, tab])
      }
    })

    return Object.fromEntries(entries)
  }

  function all(): TabsMap {
    return asTabsMap(storage.get<TabsMap>(ALL))
  }

  function readAll(): TabsMap {
    return asTabsMap(storage.read<TabsMap>(ALL))
  }

  function set(tabName: string, tab: BrowserTab): BrowserTab {
    const tabsMap = readAll()
    tabsMap[tabName] = tab
    storage.set(ALL, tabsMap)

    return tab
  }

  function get(tabName: string): BrowserTab | undefined {
    return all()[tabName]
  }

  function remove(tabName: string): void {
    const tabsMap = readAll()
    delete tabsMap[tabName]
    storage.set(ALL, tabsMap)
  }

  function update(tabName: string, tab: Partial<BrowserTab>): BrowserTab | undefined {
    const old = get(tabName)

    if (old) {
      return set(tabName, { ...old, ...tab, updatedAt: (new Date).valueOf() })
    }
  }

  function resume(tabName: string) {
    return update(tabName, { closedAt: null })
  }

  function suspend(tabName: string) {
    return update(tabName, { closedAt: (new Date).valueOf() })
  }

  function restore(): BrowserTab {
    const now = (new Date).valueOf()

    const closedTabs = Object.values(readAll())
      .filter(tab => {
        if (tab.closedAt && (now - tab.closedAt > RECENTLY_CLOSED_TTL)) {
          return remove(tab.name)
        }

        return tab.closedAt
      })
      .sort((tab1, tab2) =>
        !tab1.closedAt || !tab2.closedAt || tab1.closedAt === tab2.closedAt
          ? 0
          : tab1.closedAt > tab2.closedAt ? 1 : -1)

    if (closedTabs.length > 0) {
      const restored = closedTabs[0]

      return set(restored.name, {
        ...restored,
        updatedAt: (new Date).valueOf(),
        closedAt: null,
      })
    }

    return create(`tab-${randomId()}`)
  }

  function cleanUp() {
    const now = (new Date).valueOf()

    Object.values(readAll()).forEach(tab => {
      if (tab.closedAt && now - tab.closedAt > RECENTLY_CLOSED_TTL) {
        remove(tab.name)
      }
    })
  }

  function create(tabName: string): BrowserTab {
    const now = (new Date).valueOf()

    return set(tabName, {
      name: tabName,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
    })
  }

  export function open(): BrowserTab {
    cleanUp()

    if (window.name) {
      const tab = get(window.name) || create(window.name)

      if (tab) {
        resume(tab.name)
        return tab
      }
    }

    const restored = restore()
    window.name = restored.name

    return restored
  }

  export function close(): void {
    suspend(open().name)
  }
}

window.addEventListener('unload', BrowserTabs.close)
