var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var config = require('./config/config');
var busboy  = require('connect-busboy');
var router = express.Router();
var apiRoutes = express.Router();
var jwt = require("jsonwebtoken");
var users = require('./controller/users.js');

app.set('port', process.env.PORT || 3100);

app.use(bodyParser.urlencoded({
    limit: '500mb',
    extended: true,
    parameterLimit: 50000
}));
app.use(expressValidator());
app.use(bodyParser.json());
app.use(busboy());

router.post('/user/create', users.create);
router.post('/user/login', users.login);

apiRoutes.use(function(req, res, next) {
    console.log("headers",req.headers)
    console.log("query ",req.query)
    console.log("body",req.body)
    var token = req.body.token || req.query.token || req.headers['token'];
    if (token) {
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) {
                return res.json({"code" : 200, "status" : "Error","message" : "Failed to authenticate token"});
            } else {                
                req.user = decoded;                
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.json({"code" : 200, "status" : "Error","message" : "No token provided"});
    }
});
app.use('/api', apiRoutes);
router.post('/api/user/edit',users.edit);
router.post('/api/user/imageUpload',users.imageUpload);
router.post('/api/user/deleteUser',users.deleteUser);

app.use('/', router);

app.listen(app.get('port'));
console.log("VaboApi Started on Port No. ",app.get('port'));