export class Cache {
  private map: { [key: string]: any } = {}

  public set<T>(key: string, data: T): T {
    return this.map[key] = data
  }

  public get<T>(key: string): T | undefined {
    return this.map[key]
  }

  public remove(key: string): void {
    delete this.map[key]
  }
}
