var mysql 	= require('mysql');            //For mysql Connection
var config 	= require('../config/config'); //For App configuration 
var bcrypt  = require('bcrypt-nodejs');    //For encryption
var jwt     = require("jsonwebtoken");
var fs      = require("fs");
var busboy  = require('connect-busboy');


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
var deleteQuery = "";
var updateQuery = "";
var tableName = "";
var usercolumns = [];
var receivedValues = {};
var dbValues = [];

exports.create=function(req, res) {
    console.log("*** Requested for Creating New User... ",req.body);
    receivedValues = req.body    //DATA FROM WEB
    if(JSON.stringify(receivedValues) === '{}'){
        console.log("*** Redirecting: No appropriate data available for creating user!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for creating user"});
        return;
    }
    else{
        console.log("*** Validating User Details... ");
        usercolumns = ["username","password","country"];
        for(var iter=0;iter<usercolumns.length;iter++){
            columnName = usercolumns[iter];
            if((receivedValues[columnName] == undefined || receivedValues[columnName] == "")&& (columnName=='username' || columnName=='password')){
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                return;
            }
            else if(receivedValues[columnName] !== undefined && receivedValues[columnName] !== "" && columnName=='password'){
                var validpassword = req.checkBody('password', 'Password length should be minimum 8 digit').len(8, 15).validationErrors.length                    
                if(validpassword){
                    console.log("*** Redirecting: Password length should be minimum 8 digit");
                    res.json({"code" : 200, "status" : "Error","message" : "Password length should be minimum 8 digit"});
                    return;
                }
                else{                        
                    receivedValues.password = bcrypt.hashSync(receivedValues.password, bcrypt.genSaltSync(8))
                }                
            }
            if(columnName !=="country")
                dbValues[iter] = receivedValues[columnName];
            else
                dbValues[iter] = 1;
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
            selectQuery="SELECT count( id ) as count FROM ?? WHERE username = ?";
            connection.query(selectQuery,[tableName,[receivedValues.username]],function(err,rows){
                if(!err) { 
                    // console.log("count = ",rows[0].count);
                    if(rows[0].count>0){
                        connection.release();                
                        console.log('*** Redirecting: Username or Email already registered');
                        res.json({"code" : 200, "status" : "Error","message" : "Username or Email already registered"});
                        return;
                    }
                    else{
                        //INSERTING DATA
                        insertQuery = "INSERT INTO ?? (??) VALUES (?) ";
                        // console.log(usercolumns)
                        // console.log("dbValues = ",dbValues);
                        connection.query(insertQuery,[tableName,usercolumns,dbValues],function(err,rows){
                            connection.release();
                            // console.log("count = ",err);
                            if(!err) {
                              console.log('*** Redirecting: User Created \n');
                              res.json({"code" : 200, "status" : "OK", "message" : "User Created"}); 
                              return;    
                            } 
                            else{
                              console.log('*** Redirecting: Error Creating User...');                 
                              res.json({"code" : 200, "status" : "Error", "message" : "Error Creating User"}); 
                              return;    
                            }                      
                        });
                    }
                }
            })
        })
    }
}
//FOR EDITING/UPDATING USERS
exports.edit=function(req, res) {
	console.log("*** Requested for EDITING/UPDATING New User... ");
	receivedValues = req.body    //DATA FROM WEB
	if(JSON.stringify(receivedValues) === '{}'){
        console.log("*** Redirecting: No appropriate data available for creating user!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for creating user"});
        return;
    }
    else{
        var updateString = "";
        console.log("*** Validating User Details... ");
     	usercolumns = ["name","email","username","old_password","is_social","is_professional","language","city","country","address","zip","img_path","Q1","Q2","Q3","Q4","Q5","Q6"];
     	var checkProfessional = false;        
        //FOR VALIDATING VALUES BEFORE SUBMISSION   
     	for(var iter=0;iter<usercolumns.length;iter++){
            columnName = usercolumns[iter];
            if(receivedValues[columnName] == undefined && (columnName=='name' || columnName=='email' || columnName=='is_social' || columnName=='city' || columnName=='country' || columnName=='address' || columnName=='zip')){
                console.log("*** Redirecting: ",columnName," field is required")
                res.json({"code" : 200, "status" : "Error","message" : columnName+" field is undefined"});
                return;
            }
            else if(receivedValues[columnName] == undefined || receivedValues[columnName] == ""){      
                receivedValues[columnName]="-";                 
            }
            else if(receivedValues[columnName] !== undefined && receivedValues[columnName] !== ""){      
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
            }
            dbValues[iter] = receivedValues[columnName];
            if(columnName!=='is_professional'){ 
                if(iter==0)
                    updateString = columnName+"='"+receivedValues[columnName]+"'";        
                else
                    updateString = updateString+","+columnName+"='"+receivedValues[columnName]+"'";
            }
     	}          
        if(checkProfessional){                  //Deciding if user is professional
            receivedValues.is_professional = true;
            updateString = updateString+",is_professional=true";        
        }  
        else{
           receivedValues.is_professional = false; 
           updateString = updateString+",is_professional=false";        
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
            selectQuery="SELECT count( id ) as count FROM ?? WHERE username = ?";
            connection.query(selectQuery,[tableName,[receivedValues.username],[receivedValues.email]],function(err,rows){
                if(!err) {                    
                    if(rows[0].count==1){                        
                        console.log('*** Redirecting: Username Registered ',updateString);
                        //INSERTING DATA
                        updateQuery = "UPDATE ?? set "+updateString,
                        connection.query(updateQuery,[tableName],function(err,rows){
                            connection.release();
                            if(!err) {
                              console.log('*** Redirecting: User Updated');                 
                              res.json({"code" : 200, "status" : "OK", "message" : "User Updated"}); 
                              return;    
                            } 
                            else{
                              console.log('*** Redirecting: Error Updating User...',err);                 
                              res.json({"code" : 200, "status" : "Error", "message" : "Error Updating User"}); 
                              return;    
                            }                      
                        });
                    }
                    else{
                        connection.release();                
                        console.log('*** Redirecting: Username not registered');
                        res.json({"code" : 200, "status" : "Error","message" : "Username not registered"});
                        return;
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
//FOR UPLOADING USERS PROFILE PICTURE
exports.imageUpload=function(req, res) {
    console.log("*** Requested for Uploading Users Profile Picture... ");
    req.pipe(req.busboy);   
    req.busboy.on('file', function (fieldname, file, filename) {        
        // console.log("Uploading.....",filename); 
        filename  =filename.replace(/ /g,'');        
        var today = new Date();
        var currentDnT=today.getFullYear();
        currentDnT=currentDnT+today.getMonth()+1;
        currentDnT=currentDnT+today.getDate();
        currentDnT=currentDnT+today.getHours();
        currentDnT=currentDnT+today.getMinutes();
        currentDnT=currentDnT+today.getSeconds();              
        var newFilename='profile'+currentDnT+filename;  
        var path = 'image/'+newFilename;       
        fstream = fs.createWriteStream(path);

        file.pipe(fstream);
        fstream.on('close', function (err) {
            if (err) {
                res.json(err);
                console.log("*** Redirecting: Photo Uploading Failed!")
                res.json({"code" : 200, "status" : "Error","message" : " Photo uploading Failed"});
                return;
            }    
            res.json(newFilename);  
            console.log("*** Redirecting: Photo uploaded Successfully!")
            res.json({"code" : 200, "status" : "Success","message" : "Photo uploaded Successfully","path":path});
            return;
        });
    });   
}
//FOR USER LOGIN
exports.login=function(req, res) {
    console.log("*** Requested for Authenticating User... ");
    receivedValues = req.body    //RESPONSE FROM WEB

    if(JSON.stringify(receivedValues) === '{}'){
        // returnResponse(200,"Error","No appropriate data available for authenticating user");
        console.log("*** Redirecting: No appropriate data available for authenticating user!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for authenticating user"});
        return;
    }
    else{
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
            selectQuery="SELECT name, email, password FROM ?? WHERE username = ? ";        
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
}
//FOR DELETING USERS
exports.deleteUser=function(req, res) {
    console.log("*** Requested for Deleting User... ",req.user.username);
    receivedValues = req.body    //RESPONSE FROM WEB
    // console.log("*** Redirecting: No appropriate data available for Deleting user!")
    // res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Deleting user"});
    // return;
    if(JSON.stringify(receivedValues) === '{}'){        
        console.log("*** Redirecting: No appropriate data available for Deleting user!")
        res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Deleting user"});
        return;
    }
    else{
        if((receivedValues.id == undefined && receivedValues.token == undefined) || (receivedValues.id == "" && receivedValues.token == undefined) || (receivedValues.id == undefined && receivedValues.token == "") || (receivedValues.id == "" && receivedValues.token == "")){
            console.log("*** Redirecting: No appropriate data available for Deleting user!")
            res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Deleting user"});
            return; 
        }
        else{
            console.log("*** Received Data!");
            var value;
            if(receivedValues.id !== undefined && receivedValues.id !== 0){
                deleteQuery = "DELETE FROM ?? WHERE id = ?";
                value = receivedValues.id;
            }
            else if(receivedValues.token !== undefined && receivedValues.token !== ""){
                deleteQuery = "DELETE FROM ?? WHERE username = ?";
                value = receivedValues.username;
            }
            else{
                console.log("*** Redirecting: No appropriate data available for Deleting user!")
                res.json({"code" : 200, "status" : "Error","message" : "No appropriate data available for Deleting user"});
                return;  
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
                connection.query(deleteQuery,[tableName,[value]],function(err,rows){
                    connection.release();
                    if(!err) {                
                        // console.log("response",rows);
                        if(rows.affectedRows==0){
                            console.log('*** Redirecting: No Record Found with provided Information');
                            res.json({"code" : 200, "status" : "Success","message" : "No Record Found with provided Information"});
                            return;
                        }
                        else{
                            console.log('*** Redirecting: Record Deleted Successfully');
                            res.json({"code" : 200, "status" : "Success","message" : "Record Deleted Successfully"});
                            return;
                        }
                    }
                    else{
                        // console.log(err)
                        console.log('*** Redirecting: Failed to delete Record');
                        res.json({"code" : 200, "status" : "Error","message" : "Failed to delete Record"});
                        return;
                    }
                });
                connection.on('error', function(err) {
                    console.log('*** Redirecting: Error Deleting User...');      
                    res.json({"code" : 200, "status" : "Error", "message" : "Error Deleting User"});
                    return;    
                });
            })
        }
    }
}