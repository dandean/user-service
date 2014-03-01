# CURRENT #

To rebuild DB from scratch: `node scripts/sync.js`

## User API ##

* Flesh out the rest of the HTTP methods in the User API
* Figure out password input and hashing. Salted?



# Postgres Setup

## Postgres Install

Install [Postgress.app](http://postgresapp.com), then read docs.

**Create the Database**

    $ psql
    $ CREATE DATABASE user_service;
    $ \list
