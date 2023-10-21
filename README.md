# MJC Transaction Refactoring Prototype

This serves as the prototype for the MJC website, which will migrate to a transaction-based schema instead of the current
one-action-per-round. The benefits of migrating are several, including support for double-ron, correct support for nagashi
mangan, potential support for Sanma after slight reconfiguration, support for the full rules for pao, etc.

We need a huge amount of tests for this. Therefore, upon discussion with Peiyan, I decided to make a stub version such that
more people in the club can contribute to the development of the website.

The development of this prototype follows the Test-Driven Development pattern, where the specs are provided and the tests
are to be made before the exact implementation is available. Each contributor is expected to contribute at least 10 test
cases for this prototype; at least 4 of which should involve nontrivial situations (double ron, pao, chombo, etc).

## Configuring your environment

To start using this project, you need to get your development environment configured so that you can build and execute the code.
To do this, follow these steps; the specifics of each step will vary based on your operating system:

1. [Install git](https://git-scm.com/downloads) (v2.X). You should be able to execute `git --version` on the command line after installation is complete.

1. [Install Node LTS](https://nodejs.org/en/download/) (LTS: v18.X), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (1.22.X). You should be able to execute `yarn --version`.

1. Clone your repository by running `git clone REPO_URL` from the command line. You can get the REPO_URL by clicking on the green button on your project repository page on GitHub. Note that due to new department changes you can no longer access private git resources using https and a username and password. You will need to use either [an access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) or [SSH](https://help.github.com/en/github/authenticating-to-github/adding-a-new-ssh-key-to-your-github-account).

## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in your project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile your project. You must run this command after making changes to your TypeScript files. If it does not build locally, AutoTest will not be able to build it.

1. `yarn test` to run the test suite.

1. `yarn lint` to lint your project code. If it does not lint locally, AutoTest will not run your tests when you submit your code.

1. `yarn pretty` to prettify your project code.

## Running and testing from an IDE

IntelliJ Ultimate should be automatically configured the first time you open the project (IntelliJ Ultimate is a free download through the JetBrains student program).
