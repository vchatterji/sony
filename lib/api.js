var dgram = require('dgram');

var url = require('url');

var http = require('http');

module.exports = function() {
    var SSDP_ADDR = "239.255.255.250";
    var SSDP_ST = "urn:schemas-sony-com:service:ScalarWebAPI:1";
	
	var message = new Buffer(
			"M-SEARCH * HTTP/1.1\r\n" +
			"HOST:239.255.255.250:1900\r\n" +
			"MAN:\"ssdp:discover\"\r\n" +
			"ST:urn:schemas-sony-com:service:ScalarWebAPI:1\r\n" + // Essential, used by the client to specify what they want to discover, eg 'ST:ge:fridge'
			"MX:1\r\n" + // 1 second to respond (but they all respond immediately?)
			"\r\n"
	);
		
	function postData(urlPath, data, callback) {
		var dataString = JSON.stringify(data);
		
		var urlObj = url.parse(urlPath);

		var headers = {
		  'Content-Type': 'application/json',
		  'Content-Length': dataString.length
		};

		var options = {
		  host: urlObj.hostname,
		  port: urlObj.port,
		  path: urlObj.pathname,
		  method: 'POST',
		  headers: headers
		};
		
		// Setup the request.  The options parameter is
		// the object we defined above.
		var req = http.request(options, function(res) {
		  res.setEncoding('utf-8');

		  var responseString = '';

		  res.on('data', function(data) {
		    responseString += data;
		  });

		  res.on('end', function() {
		    var resultObject = JSON.parse(responseString);
			callback(resultObject);
		  });
		});

		req.write(dataString);
		req.end();
	}
	
	this.discover = function(callback, timeout) {
		if(!callback) {
			return;
		}
		
		var client = dgram.createSocket("udp4");
		client.bind(function() {
			var port = client.address().port;
		
			var server = dgram.createSocket("udp4");
			
			var devices = [];
			var deviceCheck = {};
 
			server.on("message", function (msg, rinfo) {
				var usn = /USN: (.*)/.exec(msg)[1];
				var loc = /LOCATION: (.*)/.exec(msg)[1];
				if(!deviceCheck[usn]) {
					deviceCheck[usn] = true;
					var request = require('request');
					request.get(loc, function (error, response, body) {
					    if (!error && response.statusCode == 200) {
					        var parseString = require('xml2js').parseString;
							parseString(body, function (err, result) {
							    var device = {};
								device.ddUrl = loc;
								device.deviceType = result.root.device[0].deviceType[0];
								device.friendlyName = result.root.device[0].friendlyName[0];
								device.manufacturer = result.root.device[0].manufacturer[0];
								device.manufacturerURL = result.root.device[0].manufacturerURL[0];
								device.modelDescription = result.root.device[0].modelDescription[0];
								device.modelName = result.root.device[0].modelName[0];
								device.UDN = result.root.device[0].UDN[0];
								
								var services = result.root.device[0]["av:X_ScalarWebAPI_DeviceInfo"][0]["av:X_ScalarWebAPI_ServiceList"][0]["av:X_ScalarWebAPI_Service"];
								
								device.apis = {};
								
								for(var i=0; i<services.length; i++) {
									var service = services[i];
									var sname = service["av:X_ScalarWebAPI_ServiceType"][0];
									var saction = service["av:X_ScalarWebAPI_ActionList_URL"][0];
									device.apis[sname.toLowerCase()] = saction;
								}
								
								device.requestId = 1;
								
								device.doRequest = function(actionName, callback) {
									if(this.apis["camera"]) {
										var url = this.apis["camera"] + "/camera";
										var toPost = {};
										toPost.method = actionName;
										toPost.params = [];
										toPost.id = this.requestId++;
										toPost.version = "1.0";
										postData(url, toPost, function(response) {
											if(callback) {
												callback(0, response);
											}
										});
									}
									else {
										if(callback) {
											callback(0, []);
										}
									}
								}
								
								device.getAvailableApiList = function(callback) {
									this.doRequest("getAvailableApiList", callback);
								};
								
								device.getApplicationInfo = function(callback) {
									this.doRequest("getApplicationInfo", callback);
								};
								
								device.startRecMode = function(callback) {
									this.doRequest("startRecMode", callback);
								};
								
								device.stopRecMode = function(callback) {
									this.doRequest("stopRecMode", callback);
								};
								
								device.startLiveview = function(callback) {
									this.doRequest("startLiveview", callback);
								};
								
								device.stopLiveview = function(callback) {
									this.doRequest("stopLiveview", callback);
								};
								
								device.actTakePicture = function(callback) {
									this.doRequest("actTakePicture", callback);
								};
								
								devices.push(device);
							});
					    }
					});
					//console.log(loc);
				}
				
				//console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
			});
 
			server.bind(port); // Bind to the random port we were given when sending the message, not 1900
 
			// Give it a while for responses to come in
			setTimeout(function(){
				if(server) {
					server.close();
					callback(0, devices);
				}
			},timeout);
			
			client.send(message, 0, message.length, 1900, "239.255.255.250");
			setTimeout(function() {
				client.send(message, 0, message.length, 1900, "239.255.255.250");
				setTimeout(function() {
					client.send(message, 0, message.length, 1900, "239.255.255.250");
					client.close();
				}, 100);
			}, 100);
		}); // So that we get a port so we can listen before sending
	}
};