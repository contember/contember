import { Cache } from './Cache'

const IS_DEV = import.meta.env.DEV ?? false

export class Storage {
  private cache = new Cache

  public constructor(
    private PREFIX: string = 'contember',
  ) {}

  private getKey(key: string) {
    return `${this.PREFIX}:${key}`
  }

  private replacer(key: string, value: any) {
    return value instanceof Set ? [...value] : value
  }

  private pack(data: any): string {
    return JSON.stringify(data, this.replacer)
  }

  private reviver(key: string, value: any) {
    return Array.isArray(value) ? new Set(value) : value
  }

  private unpack<T extends any = any>(data?: string | null): T | undefined {
    if (!data) {
      return undefined
    }

    try {
      return JSON.parse(data, this.reviver) as T
    } catch (error) {
      IS_DEV && console.warn(error)

      return undefined
    }
  }

  public read<T>(key: string): T | undefined {
    const row = this.unpack(window.localStorage.getItem(this.getKey(key)))
    this.cache.set(key, row)
    return row
  }

  public set<T>(key: string, row: T): T {
    this.cache.set(key, row)
    window.localStorage.setItem(this.getKey(key), this.pack(row))

    return row
  }

  public get<T>(key: string, insert?: T): T | undefined {
    const cached = this.cache.get<T>(key)

    if (cached) {
      return cached
    }

    const row = this.read<T>(key)

    if (row) {
      return row
    }

    if (insert) {
      return this.set(key, insert)
    }
  }

  public remove(key: string) {
    this.cache.remove(key)
    window.localStorage.removeItem(this.getKey(key))
    return key
  }
}
