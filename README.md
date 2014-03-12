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
| `deletedAt`         | Timestamp    | Date deleted                |                 |

See the [model definition](lib/models/user.js) for how this schema is declared.


API
---

### `POST /users`

Create a new user. Parameters:

* `username`
* `email`
* `password`

```sh
curl -v -X POST -H "Content-Type: application/json" \
  -d '{"username":"dandean","email":"me@dandean.com", "password":"blah1234"}' \
  "http://0.0.0.0:8082/users"
```


### `GET /users`

Get an array of all users. Query parameters:

* `query`: Searches all fields
* `username`: The username field
* `email`: The email field

```sh
curl -v -X GET "http://0.0.0.0:8082/users"`
curl -v -X GET "http://0.0.0.0:8082/users?query=dandean"
curl -v -X GET "http://0.0.0.0:8082/users?username=dandean"
curl -v -X GET "http://0.0.0.0:8082/users?email=dandean"
```


### `GET /users/:id`

Get a specific user.

```sh
curl -v -X GET "http://0.0.0.0:8082/users/31d78fe5-e9bc-4a3c-b7c5-621b307a1a5f"
```


### `PATCH /users/:id`

Patch the user with specific properties.

* `username`
* `email`
* `password`

```sh
curl -v -X PATCH -H "Content-Type: application/json" \
  -d '{"username":"dandean","email":"me@dandean.com", "password": "blah1234"}' \
  "http://0.0.0.0:8082/users/ec33bead-d53c-4de5-b168-6df836fa25da"
```


### `DELETE /users/:id`

Delete the user.

```sh
curl -v -X DELETE "http://0.0.0.0:8082/users/31d78fe5-e9bc-4a3c-b7c5-621b307a1a5f"
```


### `POST /authenticate`

Authenticate a username or email along with a password.

* `username` OR `email`
* `password`

```sh
curl -v -X POST -H "Content-Type: application/json" \
  -d '{"username":"dandean","password":"blah1234"}' \
  "http://0.0.0.0:8082/authenticate"

curl -v -X POST -H "Content-Type: application/json" \
  -d '{"email":"me@dandean.com","password":"blah1234"}' \
  "http://0.0.0.0:8082/authenticate"
```


Starting the Service
--------------------

First of all, make sure your database is up, and can be connected to with the
configuration details in your config files (see the `config` directory).

Start the server like this:

```sh
node index.js
```

Or, to get nice human-readable console output, do this:

```sh
node index.js | bunyan
```

The environment will default to `development`. You can start up in a different
environment like this:

```sh
USER_SERVICE_ENV=production node index.js | bunyan
```

Environmental configuration files are in the `config` directory.


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

Pipe application output to `bunyan` to see stdout logs in a human-readable format:

```sh
node index.js | bunyan
```

To view logs in a human-readable format, open the log with the `bunyan` CLI tool.

```sh
bunyan logs/trace.log
```

![](https://f.cloud.github.com/assets/18332/2378250/909469f2-a88c-11e3-9a82-5b369a833184.png)
