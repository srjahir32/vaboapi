var mysql 	= require('mysql');            //For mysql Connection
var config 	= require('../config/config'); //For App configuration 
var bcrypt  = require('bcrypt-nodejs');

//CREATING POOL
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
//var dataExist = false;

exports.create=function(req, res) {

	console.log("*** Creating User... ");
	receivedValues = req.body    //RESPONSE FROM WEB
	
 	usercolumns = ["name","email","username","password","old_password","is_social","is_professional","language","city","country","address","zip","img_path","Q1","Q2","Q3","Q4","Q5","Q6"];
 	var checkProfessional = false;
  //FOR VALIDATING VALUES BEFORE SUBMISSION
 	for(var iter=0;iter<usercolumns.length;iter++){
    columnName = usercolumns[iter];
    if(receivedValues[columnName] == undefined && (columnName=='name' || columnName=='email' || columnName=='username' || columnName=='password' || columnName=='is_social' || columnName=='city' || columnName=='country' || columnName=='address' || columnName=='zip')){
      console.log("*** ",columnName," field is required")
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
          //console.log(bcrypt.hashSync(receivedValues.password, bcrypt.genSaltSync(8), null));
          receivedValues.password = bcrypt.hashSync(receivedValues.password, bcrypt.genSaltSync(8), null)
        }
      }
    }
    dbValues[iter] = receivedValues[columnName];    
 	}  
  if(checkProfessional){
    receivedValues.is_professional = true;
  }
  console.log(receivedValues)
  //CREATING POOL CONNECTION
	pool.getConnection(function(err,connection){
        if (err) {
        	console.log('*** Mysql POOL Connection Failed!');
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
                //dataExist = true;
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
                      console.log('*** Error Creating User...');                 
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
        	console.log('*** Error Creating User...');      
    			res.json({"code" : 200, "status" : "Error", "message" : "Error Checking Username Duplicate"});
    			return;    
        });
  	});
}