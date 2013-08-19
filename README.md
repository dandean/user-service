User Service
============

SQL-backed REST API for User information


Schema
------

| Field               | Type         | Description                 | Attributes
| ------------------- | ---------    | --------------------------- | --------------- | 
| `id`                | CHAR(36)     | UUID of this user           | PRIMARY KEY     |
| `username`          | VARCHAR(120) | User username               | NOT NULL UNIQUE |
| `email`             | VARCHAR(255) | User email                  | NOT NULL UNIQUE |
| `password`          | VARCHAR(255) | Hashed/salted User password | NOT NULL        |
| `when_created`      | DATE         | |
| `when_modified`     | DATE         | |


API
---

**POST   /user-api/users**

Creates a new user

**GET    /user-api/users**

Gets an array of all users. Paging? Filtering?

**GET    /user-api/users/:id**

Gets a specific user.

**PUT    /user-api/users/:id**

Replaces the user object with new values.

**PATCH  /user-api/users/:id**

Patches the user with specific properties.

**DELETE /user-api/users/:id**

Deletes the user.

**GET    /user-api/usernames/:username**

Searches for a user by username.

**POST   /user-api/authenticate**

Authenticates a username or email along with a password.


Technical details
-----------------

* restify
* mysql


TODO
----

* Choose a database migration tool
* 