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


Logging
-------

Logs are written to `logs/trace.log` in JSON format using [Bunyan](https://github.com/trentm/node-bunyan).

```sh
npm install -g bunyan
```

Pipe application output to `bunyan` to get pretty-printed stdout logs:

```sh
node index.js | bunyan
```

To view logs in a human-readable format, open the log with the `bunyan` CLI tool.

```sh
bunyan logs/trace.log
```

![](https://f.cloud.github.com/assets/18332/2378250/909469f2-a88c-11e3-9a82-5b369a833184.png)
