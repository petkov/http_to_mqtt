var auth_key = process.env.AUTH_KEY || '';
var mqtt_host = process.env.MQTT_HOST || '';
var mqtt_user = process.env.MQTT_USER || '';
var mqtt_pass = process.env.MQTT_PASS || '';
var http_port = process.env.PORT || 5000;
var debug_mode = process.env.DEBUG_MODE || false;
var keep_alive_topic = process.env.KEEP_ALIVE_TOPIC || 'keep_alive';
var keep_alive_message = process.env.KEEP_ALIVE_MESSAGE || 'keep_alive';

var mqtt = require('mqtt');
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer')

var upload = multer({ dest: '/tmp/' });

var app = express();

function logRequest(req) {
  var ip = req.headers['x-forwarded-for'] ||
           req.connection.remoteAddress;
  var message = 'Received request [' + req.originalUrl + 
              '] from [' + ip + ']';

  if (debug_mode) {
    message += ' with payload [' + JSON.stringify(req.body) + ']';
  } else {
    message += '.';
  }
  console.log(message);
}

var client  = mqtt.connect(mqtt_host, {
  clientId: 'test',
  username: mqtt_user,
  password: mqtt_pass
});

app.set('port', http_port);
app.use(bodyParser.json());

app.get('/keep_alive/', function(req, res) {
  logRequest(req);
  client.publish(keep_alive_topic, keep_alive_message);
  res.send('ok');
});

app.post('/publish', upload.single('thumb'), function (req, res) {
    logRequest(req);

    var topic = req.query.topic;

    if (!topic) {
        res.send('error');
    }
    else {
        var message = req.body.payload;

        client.publish(topic, message);

        res.send('ok');
    }
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
