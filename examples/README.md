# Code examples for League Connect

This is a collection of code examples written in TypeScript that demonstrate League Connect's functionality.

Because League Connect supports both ESM and CommonJS module systems, the code has been split up so you can run
whichever you want.

## Running the examples

Example code is linked to the root directory module so you'll have to do the following before you can run anything:

```sh
git clone https://github.com/matsjla/league-connect && cd league-connect
yarn install
yarn build

# Navigate to the esm or commonjs example fodler
cd examples/esm
yarn install

# You can now run samples
yarn create-http2-requests
```

See the package.json scripts block in the `examples/esm` or `examples/commonjs` directories to see which samples are
available and runnable through Yarn.
