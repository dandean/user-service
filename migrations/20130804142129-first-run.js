module.exports = {
  up: function(migration, DataTypes, done) {
    console.log(migration)
    // migration.dropAllTables().complete(function(error) {
    // })
    done();
  },
  down: function(migration, DataTypes, done) {
    // migration.dropAllTables().complete(done);
    done();
  }
}