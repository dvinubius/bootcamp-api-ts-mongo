# Bootcamp API - Typescript & vanilla mongoDB client & Zod

- Reference to mongoose version
- Reference to medium article(s)

# TODO provide link

## basic mongoose + TS

- X - drop mongoose dependency
- X - mongo client setup
- X - schema design via zod
- X - index on reviews
- actually validate with ZOD

## alternate solutions for mongoose middleware

CONSTRAINTS
-- user owner of bootcamp is the only one who can add a course to that bootcamp --
-- max 1 bootcamp per owner --

BOOTCAMP

- owner: ref
- courses: ref[]
- participants: ref[]

USER

- bootcampOwned: subDoc
- bootcampsJoined: subDoc[]

REVIEW

- bootcamp: subDoc
- author: ref

COURSE

- bootcamp: subDoc
- owner: ref

--> first make populate work, then add parameters (specify fields to be selected)

- use redudant data instead of (reverse) populate / custom lookups

  - bootcamp.owner (ref -> populate) [CONVERT-REDUNDANT]

  - bootcamp.participants (ref -> populate) [KEEP-DYNAMIC]

  - bootcamp.courses (virtual -> reverse populate) [CONVERT-REDUNDANT]

  - user.bootcampOwned - keep as ref

  - user.bootcampsJoined (custom lookup) [KEEP-REDUNDANT]

  - course.owner (ref -> populate) [CONVERT-REDUNDANT]

- custom MW hooks

  - bootcamp.slug
  - bootcamp.address
  - bootcamp delete -> cascade to courses -> cascade to user's bootcamps owned & joined

  - course -> bootcamp.averageCost

  - review -> course.averageRating

- OPTIMIZE DESIGN FOR SPLITS IN RESPONSIBILITY (not too much logic in handlers?)
- MAKE OPERATIONS ATOMIC
- flexible lookup in advancedSearch
- make all fields unique in schemas be unique here, too -> index?

  - email
  - ... ?

## Missing Error Handling

- intentional

## No atomicity in operations (core + hook-equivalents)
