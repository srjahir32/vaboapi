var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);
var BearStrategy=require('passport-http-bearer').Strtegy;

connection.query('USE ' + dbconfig.database);
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize client_login out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM client_login WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-signup',
        new LocalStrategy({
            // by default, local strategy uses client_username and client_password, we will override with email
            client_usernameField : 'client_username',
            client_passwordField : 'client_password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, client_username, client_password, done) {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            connection.query("SELECT * FROM client_login WHERE client_username = ?",[client_username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('signupMessage', 'That client_username is already taken.'));
                } else {
                    // if there is no user with that client_username
                    // create the user
                    var newUserMysql = {
                        client_username: client_username,
                        client_password: bcrypt.hashSync(client_password, null, null)  // use the generateHash function in our user model
                    };

                    var insertQuery = "INSERT INTO client_login ( client_username, client_password ) values (?,?)";

                    connection.query(insertQuery,[newUserMysql.client_username, newUserMysql.client_password],function(err, rows) {
                        newUserMysql.id = rows.insertId;

                        return done(null, newUserMysql);
                    });
                }
            });
        })
    );

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use(
        'local-login',
        new LocalStrategy({
            // by default, local strategy uses client_username and client_password, we will override with email
            client_usernameField : 'client_username',
            client_passwordField : 'client_password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, client_username, client_password, done) { // callback with email and client_password from our form
            connection.query("SELECT * FROM client_login WHERE client_username = ?",[client_username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the client_password is wrong
                if (!bcrypt.compareSync(client_password, rows[0].client_password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong client_password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );


passport.use(new BearStrategy({},
	function(token,done){
			user.findOne({_id:token},function(err,user){
				if(!user)
					return done(null,false);
				return done(null,user);
			})
	}));

};