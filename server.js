//#!/bin/env node
//  OpenShift sample Node application
//var express = require('express');
//var fs      = require('fs');
/*
var mysql=require('mysql');
var connection =mysql.createConnection({
	host : '127.0.0.1',
	user : 'admin1GQSkCB',
	password:'9KiRXVYVkKpU',
	database:'nodejs'
	});
*/
/*	
connection.connect(function(err){
		if(err)
		{
			console.log("can not connect"+err);
			}
		else
		{
			console.log("connection successfully");
			}
	});
	*/
	/*
	connection.connect();
		var query=connection.query('SELECT * from client_login' , function(err,result,field){
			if(err)
			{
				console.log("can not get data"+err);
			}
			else
			{
				console.log(result);
			}
		});
		connection.end();*/

// try

var bodyParser = require("body-parser");
var http = require('http');
var mysql = require('mysql');
var express = require('express');
var port     = process.env.PORT || 8080;
var jwt    = require('json-web-token'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/model/user');
var morgan      = require('morgan');
var app = express();

app.set('superSecret', config.secret);

var Connection = mysql.createConnection({
	host : '127.0.0.1',
	user : 'admin1GQSkCB',
	password:'9KiRXVYVkKpU',
	database:'nodejs'
	});
	


app.set('jwtTokenSecret', 'YOUR_SECRET_STRING'); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
   
	next();
});
// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API ROUTES -------------------
// we'll get to these in a second

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);

var apiRoutes = express.Router(); 

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)

// TODO: route middleware to verify a token

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
    Connection.connect(function(err){
	var query=Connection.query('SELECT * from client_login' , function(err,users,field){
	if(err)
	{
		console.log("can not get data"+err);
	}
	else
	{
		res.json(users);
	}
	});
 });
});   

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);


var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {
	// find the user
	Connection.connect(function(err){
	var query=Connection.query('SELECT * from client_login where client_username=?',req.body.name , function(err,user,field){
	
	if(err)
	{
		console.log("can not get data"+err);
	}
	else
	{
		if (!user)
		{
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} 
		/*else if(user.password != req.body.password)
		{
			res.json({success:false , message:'Authentication failed .Password not match'});
		}*/
		else  
		{
			
		  // check if password matches
		  // if user is found and password is right
			// create a token
			//var token = jwt.sign(user, app.get('superSecret'), {
			//  expiresInMinutes: 1440 // expires in 24 hours
			//});
			// return the information including token as JSON
			//res.json({
			//  success: true,
			//  message: 'Enjoy your token!',
			//  token: token
			//});
			/*var token = jwt.encode({
				  iss: user.id,
				}, app.get('jwtTokenSecret'));*/
				/*var jwt = require('json-web-token');
				
				// var token = jwt.sign({ foo: 'bar' }, secret, { algorithm: 'HS256' });
				 var token = jwt.sign(user, secret, { expiresInMinutes: 60*5 });
			*/
			/*var secret = 'TOPSECRETTTTT';
			var token = jwt.sign(user, secret, { algorithm: 'HS256' });
				
				res.json({
                    success: true,
                    data: user,
                    token: token
					});
		 */
	
		 
		
		var secret = 'TOPSECRETTTTT';
		 
		// encode 
		jwt.encode(secret, user, function (err, token) {
			
			if (err) 
		  {
			  console.log("user not found",err);
			  return null;
			//return console.error(err.name, err.message);
		  }
		  else
		  {
				  //var parts = token.split('.');
				 res.json({
                    success: true,
                    data: user,
					type:'JWT',
					alg:'HS256',
                    token: token
					});
					
				
					
						  
		 }
			// decode 
			
			/*jwt.decode(secret, token, function (err_, decode) 
			{
			  if (err)
			  {
				return console.error(err.name, err.message);
			  } 
			  else
				{
				console.log(decode);
			  }
			});*/
			/*
			var expressjwt = require('../lib');
			req.headers = {};
			req.headers.authorization = 'Bearer ' + token;
			expressjwt({secret: secret})(req, res, function() {
			  assert.equal('foo', req.user);
			
			*/
			
			});
		}
	}
	
	});
	});
	});
	var request = require('request');
	config.k_client_id = "your_spotify_clientid";
	config.k_client_secret = "your_spotify_secret";
	config.k_client_oauth_url = 'https://accounts.spotify.com/api/token';
	
	var authHeader = 'Basic ' + new Buffer(config.k_client_id + ':' + config.k_client_secret).toString('base64');
	app.post('/token', function (req, res) {
    var code = req.body.code;
    var formObject = {
        grant_type: "authorization_code",
        redirect_uri: config.k_client_callback_url,
        code: code
    }
    var options = {
        form: formObject,
        headers: { 'Authorization': authHeader },
        url: config.k_client_oauth_url
    }

    console.log('Spotify Token request received (code):' + code);

    request.post(options, function (err, resp, body) {
        if (err) {
            console.log("Error : " + err);
        } else {
            token_data = JSON.parse(body);

            if (token_data['error'] != null) {
                console.log('Error in token data:\n' + body);
            } else {
                refresh_token = token_data['refresh_token'];
                encrypted_token = encrypt(refresh_token);
                token_data['refresh_token'] = encrypted_token;
                refresh_token = encrypted_token;

                console.log('Spotify Token served for ' + token_data['id']);
                res.send(token_data);
            }
        }
    });
});

app.use('/api', apiRoutes);
//
//var apiRoutes = express.Router(); 
//
//// route to authenticate a user (POST http://localhost:8080/api/authenticate)
//
//// route middleware to verify a token
//apiRoutes.use(function(req, res, next) {
//
//  // check header or url parameters or post parameters for token
//  var token = req.body.token || req.query.token || req.headers['x-access-token'];
//
//  // decode token
//  if (token) {
//
//    // verifies secret and checks exp
//	var secret = 'TOPSECRETTTTT';
//	jwt.decode(secret, token, function (err, decode) 
//			{
//			  if (err)
//			  {
//				return console.error(err.name, err.message);
//			  } 
//			  else
//				{
//					res.json({
//                    success: true,
//                    data: decode,
//                    
//					});
//				
//			  }
//    /*jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
//      if (err) {
//        return res.json({ success: false, message: 'Failed to authenticate token.' });    
//      } else {
//        // if everything is good, save to request for use in other routes
//        req.decoded = decoded;    
//        next();
//      }*/
//    });
//
//  } else {
//
//    // if there is no token
//    // return an error
//    return res.status(403).send({ 
//        success: false, 
//        message: 'No token provided.' 
//    });
//    
//  }
//});
//
//// route to show a random message (GET http://localhost:8080/api/)
//
//// route to return all users (GET http://localhost:8080/api/users)
//
//
//// apply the routes to our application with the prefix /api
//app.use('/User', apiRoutes);
//

/*
var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// route to show a random message (GET http://localhost:8080/api/)
// route to return all users (GET http://localhost:8080/api/users)


// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// OTHER

var app = express();
app.get('/',function(req,res){
	res.send("working");
	
});

app.get('/client', function(request, response) {
  
    client.query('SELECT * FROM client_login', function (error, results){
       if(error)
	   {
		   console.log("can not select data"+error);
	   }
	   else{
		  response.send(results); 
	   }
	   
      });
});

app.get('/client/:id', function(request, response) { 
	var id=[request.param('id')];
  client.query('SELECT * FROM client_login WHERE client_login_id=?',id , function(err,data) 
  {
		if(err)
		{
			console.log("data can not select by id"+err);
		}
		else
		{	//response.redirect('/try');
			response.send(data);
		}
	});
});
app.listen(port);
console.log("see at"+port);




// route to show a random message (GET http://localhost:8080/api/)

// route to return all users (GET http://localhost:8080/api/users)

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
	
	*/
/*
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});	
app.listen(port);
console.log("see at "+port);


var apiRoutes = express.Router(); 

// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)

// TODO: route middleware to verify a token

// route to show a random message (GET http://localhost:8080/api/)

var apiRoutes = express.Router();

/*
apiRoutes.get('/users/:id', function(request, response) { 
	var id=[request.param('id')];
  client.query('SELECT * FROM client_login WHERE client_login_id=?',id , function(err,data) 
  {
		if(err)
		{
			console.log("data can not select by id"+err);
		}
		else
		{	//response.redirect('/try');
			var user= data;
			response.send(data);
		}
	});
});
*/

/*
app.get('/setup', function(req, res) {

  // create a sample user
  var nick = new User({ 
    name: 'Nick Cerminara', 
    password: 'password',
    admin: true 
  });

  // save the sample user
  nick.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});

apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(request, response) { 

  client.query('SELECT * FROM client_login', function(err,data) 
  {
		if(err)
		{
			console.log("data can not select by id"+err);
		}
		else
		{	//response.redirect('/try');
			var user= data;
			response.send(data);
		}
	});
  });
 
app.use('/api', apiRoutes);


// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err)
	{
		console.send("can not find user"+err);
	}		
	

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
 
 });
app.use('/api', apiRoutes);
*/
/*
var apiRoutes = express.Router(); 

// route to authenticate a user (POST http://localhost:8080/api/authenticate)

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// route to show a random message (GET http://localhost:8080/api/)
// route to return all users (GET http://localhost:8080/api/users)


// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
*/
// OTHER
/*
var app = express();
app.get('/',function(req,res){
	res.send("working");
	
});

app.get('/client', function(request, response) {
  
    client.query('SELECT * FROM client_login', function (error, results){
       if(error)
	   {
		   console.log("can not select data"+error);
	   }
	   else{
		  response.send(results); 
	   }
	   
      });
});

app.get('/client/:id', function(request, response) { 
	var id=[request.param('id')];
  client.query('SELECT * FROM client_login WHERE client_login_id=?',id , function(err,data) 
  {
		if(err)
		{
			console.log("data can not select by id"+err);
		}
		else
		{	//response.redirect('/try');
			response.send(data);
		}
	});
});
app.listen(port);
console.log("see at"+port);
*/
// End Try		

/**
 *  Define the sample application.
 */
 //
//var SampleApp = function() {
//
//    //  Scope.
//    var self = this;
//
//
//    /*  ================================================================  */
//    /*  Helper functions.                                                 */
//    /*  ================================================================  */
//
//    /**
//     *  Set up server IP address and port # using env variables/defaults.
//     */
//    self.setupVariables = function() {
//        //  Set the environment variables we need.
//        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
//        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
//
//        if (typeof self.ipaddress === "undefined") {
//            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
//            //  allows us to run/test the app locally.
//            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
//            self.ipaddress = "127.0.0.1";
//        };
//    };
//
//
//    /**
//     *  Populate the cache.
//     */
//    self.populateCache = function() {
//        if (typeof self.zcache === "undefined") {
//            self.zcache = { 'index.html': '' };
//        }
//
//        //  Local cache for static content.
//        self.zcache['index.html'] = fs.readFileSync('./index.html');
//    };
//
//
//    /**
//     *  Retrieve entry (content) from cache.
//     *  @param {string} key  Key identifying content to retrieve from cache.
//     */
//    self.cache_get = function(key) { return self.zcache[key]; };
//
//
//    /**
//     *  terminator === the termination handler
//     *  Terminate server on receipt of the specified signal.
//     *  @param {string} sig  Signal to terminate on.
//     */
//    self.terminator = function(sig){
//        if (typeof sig === "string") {
//           console.log('%s: Received %s - terminating sample app ...',
//                       Date(Date.now()), sig);
//           process.exit(1);
//        }
//        console.log('%s: Node server stopped.', Date(Date.now()) );
//    };
//
//
//    /**
//     *  Setup termination handlers (for exit and a list of signals).
//     */
//    self.setupTerminationHandlers = function(){
//        //  Process on exit and signals.
//        process.on('exit', function() { self.terminator(); });
//
//        // Removed 'SIGPIPE' from the list - bugz 852598.
//        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
//         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
//        ].forEach(function(element, index, array) {
//            process.on(element, function() { self.terminator(element); });
//        });
//    };
//
//
//    /*  ================================================================  */
//    /*  App server functions (main app logic here).                       */
//    /*  ================================================================  */
//
//    /**
//     *  Create the routing table entries + handlers for the application.
//     */
//    self.createRoutes = function() {
//        self.routes = { };
//
//        self.routes['/asciimo'] = function(req, res) {
//            var link = "http://i.imgur.com/kmbjB.png";
//            res.send("<html><body><img src='" + link + "'></body></html>");
//        };
//
//        self.routes['/'] = function(req, res) {
//            res.setHeader('Content-Type', 'text/html');
//            res.send(self.cache_get('index.html') );
//        };
//    };
//
//
//    /**
//     *  Initialize the server (express) and create the routes and register
//     *  the handlers.
//     */
//    self.initializeServer = function() {
//        self.createRoutes();
//        self.app = express.createServer();
//
//        //  Add handlers for the app (from the routes).
//        for (var r in self.routes) {
//            self.app.get(r, self.routes[r]);
//        }
//    };
//
//
//    /**
//     *  Initializes the sample application.
//     */
//    self.initialize = function() {
//        self.setupVariables();
//        self.populateCache();
//        self.setupTerminationHandlers();
//
//        // Create the express server and routes.
//        self.initializeServer();
//    };
//
//
//    /**
//     *  Start the server (starts up the sample application).
//     */
//    self.start = function() {
//        //  Start the app on the specific interface (and port).
//        self.app.listen(self.port, self.ipaddress, function() {
//            console.log('%s: Node server started on %s:%d ...',
//                        Date(Date.now() ), self.ipaddress, self.port);
//        });
//    };
//
//};   /*  Sample Application.  */
//
//
//
///**
// *  main():  Main code.
// */
//var zapp = new SampleApp();
//zapp.initialize();
//zapp.start();
