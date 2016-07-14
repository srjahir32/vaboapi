var mysql 	= require('mysql');            //For mysql Connection
var config 	= require('../config/config'); //For App configuration 
var bcrypt  = require('bcrypt-nodejs');    //For encryption
var jwt     = require("jsonwebtoken");

//CONFIGURATION FOR CREATING POOL
var pool = mysql.createPool({
	connectionLimit:config.connectionLimit,
	host: config.host,
	user: config.user,
	password: config.password,
	database: config.database
});

var selectQuery = "";     
var insertQuery = "";
var tableName = "";
var usercolumns = [];
var receivedValues = {};
var dbValues = [];
//FOR CREATING NEW USERS
exports.create=function(req, res) {

	console.log("*** Requested for Creating New User... ");
	receivedValues = req.body    //DATA FROM WEB
	if(JSON.stringify(receivedValues) === '{}'){
        console.log("*** Redirecting: No appropriate data available for creating user!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for creating user"});
        return;
    }
    else{
        console.log("*** Validating User Details... ");
     	usercolumns = ["name","email","username","password","old_password","is_social","is_professional","language","city","country","address","zip","img_path","Q1","Q2","Q3","Q4","Q5","Q6"];
     	var checkProfessional = false;
        //FOR VALIDATING VALUES BEFORE SUBMISSION
     	for(var iter=0;iter<usercolumns.length;iter++){
            columnName = usercolumns[iter];
            if(receivedValues[columnName] == undefined && (columnName=='name' || columnName=='email' || columnName=='username' || columnName=='password' || columnName=='is_social' || columnName=='city' || columnName=='country' || columnName=='address' || columnName=='zip')){
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                return;
            }
            else if(receivedValues[columnName] == undefined || receivedValues[columnName] == ""){      
                receivedValues[columnName]="-";      
            }
            else if(receivedValues[columnName] !== undefined || receivedValues[columnName] !== ""){      
                if(columnName=='Q1' || columnName=='Q2' || columnName=='Q3' || columnName=='Q4' || columnName=='Q5' || columnName=='Q6'){
                    if(!checkProfessional){
                        checkProfessional = true;
                    }
                }
                else if(columnName=='email'){        
                    var validEmail = req.checkBody('email', 'Email does not appear to be valid').isEmail().validationErrors.length
                    if(validEmail){
                        console.log("*** Redirecting: Email does not appear Valid");
                        res.json({"code" : 200, "status" : "Error","message" : "Email does not appear Valid"});
                        return;
                    }
                }
                else if(columnName=='password'){        
                    var validpassword = req.checkBody('password', 'Password length should be minimum 8 digit').len(8, 15).validationErrors.length
                    //console.log(req.checkBody('password', 'Password length should be minimum 8 digit').len(8, 15).validationErrors.length);
                    if(validpassword){
                        console.log("*** Redirecting: Password length should be minimum 8 digit");
                        res.json({"code" : 200, "status" : "Error","message" : "Password length should be minimum 8 digit"});
                        return;
                    }
                    else{                        
                        receivedValues.password = bcrypt.hashSync(receivedValues.password, bcrypt.genSaltSync(8))
                    }
                }
            }
            dbValues[iter] = receivedValues[columnName];    
     	}  
        //Deciding if user is professional
        if(checkProfessional){
            receivedValues.is_professional = true;
        }  
        //CREATING POOL CONNECTION
    	pool.getConnection(function(err,connection){
            if (err) {
            	console.log('*** Redirecting: Mysql POOL Connection Failed!');
            	res.json({"code" : 200, "status" : "Error","message" : "Error in connecting database"});
            	return;
            }           
            console.log('*** Mysql POOL Connection established with ',config.database,' and connected as id ' + connection.threadId);
           	tableName = "users";
           	//CHECKING EMAIL AND USERNAME EXISTENCE
            selectQuery="SELECT count( id ) as count FROM ?? WHERE username = ? or email = ?";
            connection.query(selectQuery,[tableName,[receivedValues.username],[receivedValues.email]],function(err,rows){
                if(!err) {
                    console.log('*** Username Result Received \n', rows[0].count);
                    if(rows[0].count>0){
                        connection.release();                
                        console.log('*** Redirecting: Username or Email already registered');
                        res.json({"code" : 200, "status" : "Error","message" : "Username or Email already registered"});
                        return;
                    }
                    else{
                        //INSERTING DATA
                        insertQuery = "INSERT INTO ?? (??) VALUES (?) ",
                        connection.query(insertQuery,[tableName,usercolumns,dbValues],function(err,rows){
                            connection.release();
                            if(!err) {
                              console.log('*** ResultSet Received \n');
                              res.json({"code" : 200, "status" : "OK", "message" : "User Created"}); 
                            } 
                            else{
                              console.log('*** Redirecting: Error Creating User...');                 
                              res.json({"code" : 200, "status" : "Error", "message" : "Error in connecting database"}); 
                            }                      
                        });
                    }
                } 
                else{
                  console.log(err);
                  res.json({"code" : 200, "status" : "Error", "message" : "Error Checking Username Duplicate"}); 
                }              
            });       

            connection.on('error', function(err) {
            	console.log('*** Redirecting: Error Creating User...');      
    			res.json({"code" : 200, "status" : "Error", "message" : "Error Checking Username Duplicate"});
    			return;    
            });
      	});
    }
}
//FOR USER LOGIN
exports.login=function(req, res) {
    console.log("*** Requested for Authenticating User... ");
    receivedValues = req.body    //RESPONSE FROM WEB
    usercolumns = ["username","password"];
    for(var iter=0;iter<usercolumns.length;iter++){
        columnName = usercolumns[iter];
        if(receivedValues[columnName] == undefined && (columnName=='username' || columnName=='password')){
            console.log("*** Redirecting: ",columnName," field is required")
            res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
            return; 
        }
        else if(receivedValues[columnName] !== undefined || receivedValues[columnName] !== ""){
            if(columnName=='password'){        
                var validpassword = req.checkBody('password', 'Password length should be minimum 8 digit').len(8, 15).validationErrors.length;                
                if(validpassword){
                    console.log("*** Redirecting: Password length should be minimum 8 digit");
                    res.json({"code" : 200, "status" : "Error","message" : "Password length should be minimum 8 digit"});
                    return;
                }                
            }
        }
    }
    //CREATING POOL CONNECTION
    pool.getConnection(function(err,connection){
        if (err) {
            console.log('*** Redirecting: Mysql POOL Connection Failed!');
            res.json({"code" : 200, "status" : "Error","message" : "Error in connecting database"});
            return;
        }
        console.log('*** Mysql POOL Connection established with ',config.database,' and connected as id ' + connection.threadId);
        tableName = "users";
        //CHECKING USERNAME EXISTENCE
        selectQuery="SELECT name,email,password FROM ?? WHERE username = ? ";        
        connection.query(selectQuery,[tableName,[receivedValues.username]],function(err,rows){
            connection.release();
            if(!err) {                
                if(rows.length==1){                    
                    if(bcrypt.compareSync(receivedValues.password,rows[0].password)){                        
                        receivedValues.password = "";
                        var token = jwt.sign(receivedValues, config.secret, {
                                        expiresIn: 1440 * 60 * 30 // expires in 1440 minutes
                                    });
                        console.log("*** Authorised User");
                        res.json({"code" : 200, "status" : "Success","data": token,"message" : "Authorised User!"});
                    }
                    else{
                        console.log("*** Redirecting: Unauthorised User");
                        res.json({"code" : 200, "status" : "Fail","message" : "Unauthorised User!"});
                    }
                    return;
                }
                else{
                    console.log("*** Redirecting: No User found with provided name");
                    res.json({"code" : 200, "status" : "Error","message" : "No User found with provided name"});
                    return;
                }
            }
            else{
                console.log(err)
            }
        });
        connection.on('error', function(err) {
            console.log('*** Redirecting: Error Creating User...');      
            res.json({"code" : 200, "status" : "Error", "message" : "Error Checking Username Duplicate"});
            return;    
        });
    })
}