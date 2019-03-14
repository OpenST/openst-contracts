# OpenST Contracts - Empowering Decentralized Economies

OpenST Contracts is a collection of smart contracts that enable developers to
program Token Economies.

## Getting Started

These instructions will get you a copy of the project up and running on your
local machine for development and testing purposes. See deployment for notes on
how to deploy the project on a live system.

### Prerequisites

Project requires [node](https://nodejs.org/en/) and
[npm](https://www.npmjs.com/get-npm) to be installed on dev machine.

### Cloning

In case of fresh clone, use `--recursive-submodules` option while cloning:

```bash
git clone --recursive-submodules git@github.com:openst/openst-contracts.git
```

To update git submodules for already cloned repos, run:

```bash
git submodule update --init --recursive
```

### Installing

Install npm packages, by running:

```bash
npm install
```

Afterwards, add `./node_modules/.bin` to `PATH` environment variable:

```bash
export PATH=./node_modules/.bin:${PATH}
```

## Compiling the contracts

The following npm script compiles updated contracts from the last call:

```bash
npm run compile
```

, to compile all contracts, run:

```bash
npm run compile-all
```

## Linters

### Solidity

In `openst-contracts` to lint solidity files we use [Ethlint](https://github.com/duaraghav8/Ethlint).
The following npm script lints all contracts within `./contracts` directory:

```bash
npm run lint:sol
```

[Ethlint](https://github.com/duaraghav8/Ethlint) is able to fix a subset of rules.
The following npm script fixes (only a subset of rules) contracts within `./contracts` directory:

```bash
npm run lint:sol:fix
```

### JS

[ESLint](https://eslint.org) is used to lint js files.

To lint all js files within `./test` directory, run:

```bash
npm run lint:js
```

[ESLint](https://eslint.org) is able to fix a subset of rules.
To fix js files, run:

```bash
npm run lint:js:fix
```

## Running the tests

Before running the tests run `ganache-cli` by:

```bash
npm run ganache-cli
```

Run tests by calling:

```bash
npm run test
```

## Contributing

Please read [CODE_OF_CONDUCT.md](https://github.com/openst/openst-contracts/blob/develop/CODE_OF_CONDUCT.md)
for details on our code of conduct, and the process for submitting pull
requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available,
see the [tags on this repository](https://github.com/openst/openst-contracts/tags).

## Authors

See also the list of [contributors](https://github.com/openst/openst-contracts/contributors)
who participated in this project.

## License

This contracts are licensed under the Apache License Version 2.0 - see
the [LICENSE.md](https://github.com/openst/openst-contracts/blob/develop/LICENSE.md)
file for details.
