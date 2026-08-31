# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [26.0.0](https://github.com/lensapp/ogre-tools/compare/v25.0.0...v26.0.0) (2026-08-31)

**Note:** Version bump only for package @lensapp/discoverable

## [25.0.0](https://github.com/lensapp/ogre-tools/compare/v24.1.0...v25.0.0) (2026-08-27)

### ⚠ BREAKING CHANGES

- marker on any of them. This commit's marker is what
  makes conventional-commits tooling recommend major for the upcoming
  release instead of minor.
- getInjectionToken2 and getInjectionTokenComponent2
  (injectable-react) drop their outer empty curry -- options are now the
  direct first call, with the `.for()` factory moved out of options into
  an optional trailing call instead of an options property:

  // before
  getInjectionToken2<F>()({ id, cardinality, specificInjectionTokenFactory: factory })
  getInjectionTokenComponent2<Component>({ id, specificInjectionTokenFactory: factory })

  // after
  getInjectionToken2<F>({ id, cardinality })(factory)
  getInjectionTokenComponent2<Component>({ id })(factory)

getAbstractInjectionToken2 and getAbstractInjectionTokenComponent2 are
removed. Supplying a factory to the trailing call above is what makes a
token abstract now; omitting it makes a concrete token, same creator
either way:

// before
getAbstractInjectionToken2<F>()({ id, cardinality, specificInjectionTokenFactory: factory })

// after
getInjectionToken2<F>({ id, cardinality })(factory)

getSpecificInjectionToken2 is removed. Options carrying `speciality`
now route through the same getInjectionToken2, which also accepts the
trailing factory, so a specific token can itself be a family root:

// before
getSpecificInjectionToken2<F>()({ id, speciality, cardinality })

// after
getInjectionToken2<F>({ id, speciality, cardinality })(factory?)

A token built with no factory now has no `.for` at all, not a working
default: previously, omitting `specificInjectionTokenFactory` still
produced a working recursive id-keyed `.for()` at runtime. Now,
`getInjectionToken2<F>(options)()` (empty trailing call) yields a
token with no `.for` property in its type -- a compile error to
access -- and no `for` key on the runtime object. Supply a factory
explicitly whenever `.for()` is needed, even a trivial recursive one.

### Miscellaneous Chores

- Prep for major version bump ([e6e1e3e](https://github.com/lensapp/ogre-tools/commit/e6e1e3e887909480f261737135a450a0047b4528))

## [24.1.0](https://github.com/lensapp/ogre-tools/compare/v24.0.0...v24.1.0) (2026-08-25)

**Note:** Version bump only for package @lensapp/discoverable

## [24.0.0](https://github.com/lensapp/ogre-tools/compare/v23.1.0...v24.0.0) (2026-08-24)

**Note:** Version bump only for package @lensapp/discoverable

## [23.1.0](https://github.com/lensapp/ogre-tools/compare/v23.0.0...v23.1.0) (2026-08-20)

**Note:** Version bump only for package @lensapp/discoverable

## [23.0.0](https://github.com/lensapp/ogre-tools/compare/v22.4.0...v23.0.0) (2026-08-19)

**Note:** Version bump only for package @lensapp/discoverable

## [22.4.0](https://github.com/lensapp/ogre-tools/compare/v22.3.0...v22.4.0) (2026-08-17)

**Note:** Version bump only for package @lensapp/discoverable

## [22.3.0](https://github.com/lensapp/ogre-tools/compare/v22.2.0...v22.3.0) (2026-05-19)

**Note:** Version bump only for package @lensapp/discoverable

## [22.2.0](https://github.com/lensapp/ogre-tools/compare/v22.1.0...v22.2.0) (2026-05-04)

**Note:** Version bump only for package @lensapp/discoverable

## [22.1.0](https://github.com/lensapp/ogre-tools/compare/v22.0.0...v22.1.0) (2026-04-24)

### Features

- Add dual CJS/ESM build output for all packages ([639e19e](https://github.com/lensapp/ogre-tools/commit/639e19e1db7c65b2c53a6234669f23219228299f))

## [22.0.0](https://github.com/lensapp/ogre-tools/compare/v21.1.0...v22.0.0) (2026-04-24)

**Note:** Version bump only for package @lensapp/discoverable

## [21.1.0](https://github.com/lensapp/ogre-tools/compare/v21.0.3...v21.1.0) (2026-03-19)

**Note:** Version bump only for package @lensapp/discoverable

### [21.0.3](https://github.com/lensapp/ogre-tools/compare/v21.0.2...v21.0.3) (2026-02-20)

**Note:** Version bump only for package @lensapp/discoverable

### [21.0.2](https://github.com/lensapp/ogre-tools/compare/v21.0.1...v21.0.2) (2026-02-18)

**Note:** Version bump only for package @lensapp/discoverable

### [21.0.1](https://github.com/lensapp/ogre-tools/compare/v21.0.0...v21.0.1) (2026-02-03)

**Note:** Version bump only for package @lensapp/discoverable

## [21.0.0](https://github.com/lensapp/ogre-tools/compare/v20.8.0...v21.0.0) (2025-11-14)

**Note:** Version bump only for package @lensapp/discoverable

## [20.8.0](https://github.com/lensapp/ogre-tools/compare/v20.7.0...v20.8.0) (2025-10-23)

**Note:** Version bump only for package @lensapp/discoverable

## [20.7.0](https://github.com/lensapp/ogre-tools/compare/v20.6.6...v20.7.0) (2025-10-14)

### Features

- Support react 19 ([134e081](https://github.com/lensapp/ogre-tools/commit/134e08143aa319003edee4cf438d0fe172ea359c))

### [20.6.7](https://github.com/lensapp/ogre-tools/compare/v20.6.6...v20.6.7) (2025-09-30)

**Note:** Version bump only for package @lensapp/discoverable

### [20.6.6](https://github.com/lensapp/ogre-tools/compare/v20.6.5...v20.6.6) (2025-09-08)

**Note:** Version bump only for package @lensapp/discoverable

### [20.6.5](https://github.com/lensapp/ogre-tools/compare/v20.6.4...v20.6.5) (2025-09-04)

**Note:** Version bump only for package @lensapp/discoverable

### [20.6.4](https://github.com/lensapp/ogre-tools/compare/v20.6.3...v20.6.4) (2025-09-03)

**Note:** Version bump only for package @lensapp/discoverable

### [20.6.3](https://github.com/lensapp/ogre-tools/compare/v20.6.2...v20.6.3) (2025-06-02)

**Note:** Version bump only for package @lensapp/discoverable

### [20.6.2](https://github.com/lensapp/ogre-tools/compare/v20.6.1...v20.6.2) (2025-05-20)

**Note:** Version bump only for package @lensapp/discoverable

### [20.6.1](https://github.com/lensapp/ogre-tools/compare/v20.6.0...v20.6.1) (2025-05-08)

**Note:** Version bump only for package @lensapp/discoverable

## [20.6.0](https://github.com/lensapp/ogre-tools/compare/v20.5.4...v20.6.0) (2025-03-20)

**Note:** Version bump only for package @lensapp/discoverable

### [20.5.4](https://github.com/lensapp/ogre-tools/compare/v20.5.3...v20.5.4) (2025-03-19)

**Note:** Version bump only for package @lensapp/discoverable

### [20.5.3](https://github.com/lensapp/ogre-tools/compare/v20.5.2...v20.5.3) (2025-02-24)

**Note:** Version bump only for package @lensapp/discoverable

### [20.5.2](https://github.com/lensapp/ogre-tools/compare/v20.5.1...v20.5.2) (2025-02-21)

**Note:** Version bump only for package @lensapp/discoverable

### [20.5.1](https://github.com/lensapp/ogre-tools/compare/v20.5.0...v20.5.1) (2025-02-21)

**Note:** Version bump only for package @lensapp/discoverable

## [20.5.0](https://github.com/lensapp/ogre-tools/compare/v20.4.1...v20.5.0) (2025-02-10)

**Note:** Version bump only for package @lensapp/discoverable

### [20.4.1](https://github.com/lensapp/ogre-tools/compare/v20.4.0...v20.4.1) (2025-01-31)

**Note:** Version bump only for package @lensapp/discoverable

## [20.4.0](https://github.com/lensapp/ogre-tools/compare/v20.3.0...v20.4.0) (2025-01-30)

**Note:** Version bump only for package @lensapp/discoverable

## [20.3.0](https://github.com/lensapp/ogre-tools/compare/v20.2.1...v20.3.0) (2025-01-30)

**Note:** Version bump only for package @lensapp/discoverable

### [20.2.1](https://github.com/lensapp/ogre-tools/compare/v20.2.0...v20.2.1) (2025-01-23)

**Note:** Version bump only for package @lensapp/discoverable

## [20.2.0](https://github.com/lensapp/ogre-tools/compare/v20.1.0...v20.2.0) (2025-01-22)

### Features

- Introduce "discoverable", a test-utility to control HTML-elements using data-attributes ([eece23a](https://github.com/lensapp/ogre-tools/commit/eece23a115d1cb0e8a1781b0cc3ad5c04179c179))
