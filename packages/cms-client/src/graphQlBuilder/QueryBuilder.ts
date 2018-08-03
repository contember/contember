import RootObjectBuilder from "./RootObjectBuilder";
import QueryCompiler from "./QueryCompiler";
import Literal from "./Literal";

class QueryBuilder
{
  query(builder: ((builder: RootObjectBuilder) => RootObjectBuilder) | RootObjectBuilder): string
  {
    if (!(builder instanceof RootObjectBuilder)) {
      builder = builder(new RootObjectBuilder())
    }
    const compiler = new QueryCompiler('query', builder)
    return compiler.create()
  }

  mutation(builder: ((builder: RootObjectBuilder) => RootObjectBuilder) | RootObjectBuilder): string
  {
    if (!(builder instanceof RootObjectBuilder)) {
      builder = builder(new RootObjectBuilder())
    }
    const compiler = new QueryCompiler('mutation', builder)
    return compiler.create()
  }
}

namespace QueryBuilder
{
  export interface Object
  {
    [key: string]: Value
  }

  export interface List extends Array<Value>
  {
  }

  export type AtomicValue = string | null | number | boolean | Literal
  export type Value = AtomicValue | Object | List
}

export default QueryBuilder
