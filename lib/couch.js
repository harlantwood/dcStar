var q = require('q');
var utils = require('./utils.js');
var config = utils.loadConfig();
var nano = require('nano')("http://" + config.couch_admin + ":" + config.couch_password + "@" + config.couch_host + ':' + config.couch_port);

/*
 * insert dust into the database
 *
 * @param {dust:object} dust object to be inserted
 * @param {app:string} name of application
 * @param {creds:object} credentials
 *
 */
exports.insertDust = function (dust, app, creds, cb) {

   var appDB = nano.use(creds.username + "_" + app);

   appDB.insert(dust, function (err, res) {
      if (err) {
         console.log(err);
         cb("failed", null);
      }
      else {
         cb(null, res);
      }
   });
}



/*
 * gets dust from the database by params
 *
 * @param {name:string} name of user
 *
 */
exports.getDust = function (app, dust, cb) {

   var users = nano.use(app);

   users.get(name, function (err, user) {
      if (err) {
         console.log(err);
         cb("failed", null);
      }
      else {
         cb(null, user);
      }
   });
}


/*
 * lists user from the database that match params
 *
 * @param {config:object} couchdb config
 * @param {params:object} search by parameters
 *
 */
exports.listDust = function (app, params, cb) {

   var users = nano.use(app);

   users.list(params, function (err, users) {
      if (err) {
         console.log(err);
         cb("failed", null);
      }
      else {
         cb(null, users);
      }
   });
}


/*
 * gets a user from the database by params
 *
 * @param {username:string} name of document in _users
 *
 */
exports.getUser = function (username, cb) {

   var users = nano.use("_users");

   users.get(username, function (err, user) {
      if (err) {
         console.log(err);
         cb("failed", null);
      }
      else {
         cb(null, user);
      }
   });
}





/*
 * creates user
 *
 * @param {creds:object} credentials
 *
 */
exports.createUser = function (creds, cb) {

   var users = nano.use("_users");

   var user = {
      _id: "org.couchdb.user:" + creds.username,
      name: creds.username,
      roles: [],
      type: "user",
      password: creds.password,
      email: creds.email
   };

   users.insert(user, user._id, function (err, res) {
      if (err) {
         cb(new Error("Error message: " + err.message, null));
      }
      else {
         cb(null, res);
      }
   });

};




/*
 * creates database for app, apply security settings of user
 *
 * @param {app:string} name of application
 * @param {creds:object} credentials
 *
 */
exports.createDB = function (app, creds, cb) {

   var dbname = creds.username + "_" + app;
   var userDB = nano.use(dbname);
   var secObj = {
      admins: {
         names: [],
         roles: []
      },
      members: {
         names: [creds.username],
         roles: []
      }
   };


   function createDB() {
      var deferred = q.defer();

      nano.db.create(dbname, function (err, body) {
         if (err) {
            deferred.reject(new Error("Error message: " + err.message));
         }
         else {
            deferred.resolve(body);
         }
      });
      return deferred.promise;
   }


   function updateSecurity() {
      var deferred = q.defer();

      userDB.insert(secObj, "_security", function (err, body) {
         if (err) {
            deferred.reject(new Error("Error message: " + err.message));
         }
         else {
            deferred.resolve(body);
         }
      });
      return deferred.promise;
   }


   createDB()
      .then(updateSecurity())
      .then(function (response) {
         console.log(response);
         cb(null, dbname);
      }, function (error) {
         console.log(error);
         cb("failed", null);
      });


};

