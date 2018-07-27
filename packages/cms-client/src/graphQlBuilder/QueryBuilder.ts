import { RootObjectBuilder } from "./RootObjectBuilder";
import { QueryCompiler } from "./QueryCompiler";

export class QueryBuilder
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
