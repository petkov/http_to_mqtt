var auth_key = process.env.AUTH_KEY || '';
var mqtt_host = process.env.MQTT_HOST || '';
var mqtt_user = process.env.MQTT_USER || '';
var mqtt_pass = process.env.MQTT_PASS || '';
var http_port = process.env.PORT || 5000;

var mqtt = require('mqtt');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

function logRequest(req) {
  var ip = req.headers['x-forwarded-for'] ||
           req.connection.remoteAddress;
  console.log('Received request [' + req.originalUrl + 
              '] from [' + ip + '].');
}

var client  = mqtt.connect(mqtt_host, {
  clientId: 'test',
  username: mqtt_user,
  password: mqtt_pass
});

app.set('port', http_port);
app.use(bodyParser.json());

app.get('/status/', function(req, res) {
  logRequest(req);
  res.send('ok');
});

app.post('/post/', function(req, res) {
  logRequest(req);
  if (!auth_key || req.body['key'] != auth_key) {
    console.log('Request is not authorized.');
    res.send();
    return;
  }
  
  if (req.body['topic']) {
    client.publish(req.body['topic'], req.body['message']);
    res.send('ok');
  } else {
    res.send('error');
  }
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});