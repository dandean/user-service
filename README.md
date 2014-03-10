User Service
============

SQL-backed REST API for User information


Schema
------

| Field               | Type         | Description                 | Attributes      |
| ------------------- | ---------    | --------------------------- | --------------- | 
| `id`                | UUID         | UUID of this user           | PRIMARY KEY     |
| `username`          | VARCHAR(120) | User username               | NOT NULL UNIQUE |
| `email`             | VARCHAR(255) | User email                  | NOT NULL UNIQUE |
| `password`          | VARCHAR(255) | Hashed/salted User password | NOT NULL        |
| `createdAt`         | Timestamp    | Date created                | NOT NULL        |
| `modifiedAt`        | Timestamp    | Date modified               | NOT NULL        |
| `deletedAt`         | Timestamp    | Date deleted                | NOT NULL        |

See the [model definition](lib/models/user.js) for how thes schema is declared.


API
---

### `POST /users`

Creates a new user


### `GET /users`

Gets an array of all users. Paging? Filtering?


### `GET /users/:id`

Gets a specific user.


### `PATCH /users/:id`

Patches the user with specific properties.


### `DELETE /users/:id`

Deletes the user.


### `POST /authenticate`

Authenticates a username or email along with a password.


Technical details
-----------------

* Server API build on [Restify](https://github.com/mcavage/node-restify)
* Database is Postgres
* [Sequelize](http://sequelizejs.com/) is used to communicate with Postgres
