Usage
====

- Create `.env` file (see `example.env`)
- Run `npm start`, which initializes db, starts a server and runs the benchmark. You can run this command with optional `name` parameter. Then it will save results in `./results/{name}` directory
- You can also start only benchmark itself on running and initialized server using command `npm run benchmark [name]`. In this case you have to also provide `ACCESS_TOKEN` environment variable
- You can compare  stored results using `npm run compare [aName] [bName]`
