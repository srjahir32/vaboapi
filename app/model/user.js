var mysql=require('mysql');
var connection =mysql.createConnection({
	host : '127.0.0.1',
	user : 'admin1GQSkCB',
	password:'9KiRXVYVkKpU',
	database:'nodejs'
	});
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
	connection.connect();
		var query=connection.query('SELECT * from client_login' , function(err,result,field){
			if(err)
			{
				console.log("can not get data"+err);
			}
			else
			{
				module.exports=(result);
			}
		});
		connection.end();