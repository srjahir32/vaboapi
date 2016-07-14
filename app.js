var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
//var config = require('./config/config');
var router = express.Router();
var apiRoutes = express.Router();
var jwt = require("jsonwebtoken");
var users = require('./controller/users.js');

app.set('port', process.env.PORT || 3100);

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));
app.use(expressValidator());
app.use(bodyParser.json());


router.post('/user/create', users.create);
router.post('/user/login', users.login);
apiRoutes.use(function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['token'];
    if (token) {
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.',
                    data: null
                });
            } else {
                req.user = decoded._doc;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.',
            data: null
        });
    }
});
//app.use('/api', apiRoutes);

app.use('/', router);
app.listen(app.get('port'));
console.log("Vabo App Started on Port No. ",app.get('port'));