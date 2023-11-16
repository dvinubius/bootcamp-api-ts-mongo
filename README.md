# Bootcamp API - Typescript & vanilla mongoDB & Zod

- TS + Mongoose version is in this [repo](https://github.com/dvinubius/bootcamp-api-ts-goose)

- Reference to medium [article(s)](https://medium.com)

### TODO medium link 👆

## basic mongoose + TS

- ✅ drop mongoose dependency
- ✅ mongo client setup
- ✅ schema design via zod
- ✅ actually validate with ZOD
- ✅ index on reviews
- ✅ extract service logic from route handlers
- ✅ change schema design: bootcamp references populated persistently, other references are looked up
- ✅ replicate mongoose middleware (calculations) with mongo adaptor
- ✅ replicate mongoose lookups with mongo adaptor
- ✅ update seeder to accomodate new schema
- ✅ advanced search with mongo adaptor: aggregation pipeline incl. advanced filtering

## Schema Design Summary

CONSTRAINTS
-- user owner of bootcamp is the only one who can add a course to that bootcamp --
-- max 1 bootcamp per owner --

> Only bootcamps references are persisted as subdocuments. The others are looked up on the fly when requested.

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

## Suboptimal Functionality / Design

- Missing Error Handling (always assuming db CRUD ops succeed)
- No atomicity in operations (basic CRUD + hook-equivalents should occur together atomically)

- Advanced search
  - not properly validating queryParams -> suboptimal error handling
  - agg pipeline stages for advanced filtering uses hardcoded fields (identify fields that are arrays)
  - casting of queryParams to numbers where necessary -> identified based on hardcoded fields
