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
                    console.log("count = ",rows[0].count);
                    if(rows[0].count>0){
                        connection.release();                
                        console.log('*** Redirecting: Username or Email already registered');
                        res.json({"code" : 200, "status" : "Error","message" : "Username or Email already registered"});
                        return;
                    }
                    else{
                        //INSERTING DATA
                        insertQuery = "INSERT INTO ?? (??) VALUES (?) ";
                        console.log(usercolumns)
                        console.log("dbValues = ",dbValues);
                        connection.query(insertQuery,[tableName,usercolumns,dbValues],function(err,rows){
                            connection.release();
                            console.log("count = ",err);
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
        console.log("Uploading.....",filename); 
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
    // upload(req,res,function(err){
    //     console.log("Uploading.....",req.file.path);
    //     if(err){
    //          res.json({error_code:1,err_desc:err});
    //          return;
    //     }
    //     res.json({error_code:0,err_desc:null,path:req.file.path});
    // });
    // if(receivedValues.img !== undefined && receivedValues.img !== ""){
    //     console.log("image ", receivedValues.img)
    //     var base64Data = "9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAvAAD/4QNxaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6QjA3RTExMEUxRjIwNjgxMTgwODNBMkFGNDJGMDRCNEEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OUY0RjE2QzI5RTU2MTFFNDkyQ0NBOTEyMkY2MEUyRTkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OUY0RjE2QzE5RTU2MTFFNDkyQ0NBOTEyMkY2MEUyRTkiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjNBMjhFNUZDNjEyMDY4MTE4MjJBRDg1RkNBRjQxQjFCIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkIwN0UxMTBFMUYyMDY4MTE4MDgzQTJBRjQyRjA0QjRBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwve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"
    //     if (!fs.existsSync("./image")){
    //         fs.mkdirSync("./image");
    //     }
    //     fs.writeFile("./image/check.jpeg", base64Data, 'base64',function(err) {
    //         if (err) {
    //             console.log("asd  #",err )
    //         }
    //         else{
    //             console.log("done")   
    //         }
    //     })
    // }
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
                        console.log("response",rows);
                        if(rows.affectedRows==0){
                            console.log('*** Redirecting: No Record Found with provided Information');
                            res.json({"code" : 200, "status" : "Success","message" : "Error in connecting database"});
                            return;
                        }
                        else{
                            console.log('*** Redirecting: Record Deleted Successfully');
                            res.json({"code" : 200, "status" : "Success","message" : "Record Deleted Successfully"});
                            return;
                        }
                    }
                    else{
                        console.log(err)
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