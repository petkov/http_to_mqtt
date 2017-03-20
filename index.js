var mqtt_host = process.env.MQTT_HOST || '';
var mqtt_user = process.env.MQTT_USER || '';
var mqtt_pass = process.env.MQTT_PASS || '';
var http_port = process.env.PORT || 5000;

var express = require('express');
var app = express();
var mqtt = require('mqtt');
var client  = mqtt.connect(mqtt_host, {
  clientId: 'test',
  username: mqtt_user,
  password: mqtt_pass
});

app.set('port', http_port);

app.get('/post/:topic/:content', function(req, res) {
  res.send('topic:' + req.params['topic'] + ';content:' + req.params['content']);
  client.publish(req.params['topic'], req.params['content']);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});