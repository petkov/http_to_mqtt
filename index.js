var settings = {
    mqtt: {
        host: process.env.MQTT_HOST || '',
        user: process.env.MQTT_USER || '',
        password: process.env.MQTT_PASS || '',
        clientId: process.env.MQTT_CLIENT_ID || null,
        protocol: process.env.MQTT_PROTOCOL || 'mqtt'
    },
    keepalive: {
        topic: process.env.KEEP_ALIVE_TOPIC || 'keep_alive',
        message: process.env.KEEP_ALIVE_MESSAGE || 'keep_alive'
    },
    debug: process.env.DEBUG_MODE || false,
    auth_key: process.env.AUTH_KEY || '',
    http_port: process.env.PORT || 5000
};

(function (args) {
    function printUsage(errorMessage) {
        if (errorMessage)
            console.error(errorMessage);

        console.log('Usage: npm start -- [options]');
        console.log('');
        console.log('Options:');
        console.log("\t-c config.json\t load configuration from JSON file");
        console.log("\t---help\t\t print usage and exit");
    }

    function merge(target, source) {
        for (key in source) {
            if (typeof source[key] === 'object') {
                if (!target[key]) {
                    target[key] = {};
                }

                merge(target[key], source[key]);
            }
            else {
                target[key] = source[key];
            }
        }
    }
    
    // start with i = 2.  0 == node executable, 1 == index.js (this script)
    for (var i = 2; i < args.length; ++i) {
        switch (args[i]) {
            case '-c':
                ++i;
                var config = require(args[i]);

                merge(settings, config);
                break;
            case '--help':
                printUsage();
                process.exit();
                break;
            default:
                printUsage("unknown option specified: " + args[i]);
                process.exit(1);
                break;
        }
    }

})(process.argv);

var mqtt = require('mqtt');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');

var app = express();

function getMqttClient() {

    var options = {
        username: settings.mqtt.user,
        password: settings.mqtt.password,
        protocol: settings.mqtt.protocol
    };

    if (settings.mqtt.clientId) {
        options.clientId = settings.mqtt.clientId
    }

    return mqtt.connect(settings.mqtt.host, options);
}

var mqttClient = getMqttClient();

app.set('port', settings.http_port);
app.use(bodyParser.json());

function logRequest(req, res, next) {
    var ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress;
    var message = 'Received request [' + req.originalUrl +
        '] from [' + ip + ']';

    if (settings.debug) {
        message += ' with payload [' + JSON.stringify(req.body) + ']';
    } else {
        message += '.';
    }
    console.log(message);

    next();
}

function authorizeUser(req, res, next) {
    if (settings.auth_key && req.body['key'] != settings.auth_key) {
        console.log('Request is not authorized.');
        res.sendStatus(401);
    }
    else {
        next();
    }
}

function checkSingleFileUpload(req, res, next) {
    if (req.query.single) {
        var upload = multer().single(req.query.single);

        upload(req, res, next);
    }
    else {
        next();
    }
}

function checkMessagePathQueryParameter(req, res, next) {
    if (req.query.path) {
        req.body.message = req.body[req.query.path];
    }
    next();
}

function checkTopicQueryParameter(req, res, next) {

    if (req.query.topic) {
        req.body.topic = req.query.topic;
    }

    next();
}

function ensureTopicSpecified(req, res, next) {
    if (!req.body.topic) {
        res.status(500).send('Topic not specified');
    }
    else {
        next();
    }
}

app.get('/keep_alive/', logRequest, function (req, res) {
    mqttClient.publish(settings.keepalive.topic, settings.keepalive.message);
    res.sendStatus(200);
});

app.post('/post/', logRequest, authorizeUser, checkSingleFileUpload, checkMessagePathQueryParameter, checkTopicQueryParameter, ensureTopicSpecified, function (req, res) {
    mqttClient.publish(req.body['topic'], req.body['message']);
    res.sendStatus(200);
});

app.get('/subscribe/', logRequest, authorizeUser, function (req, res) {

    var topic = req.query.topic;

    if (!topic) {
        res.status(500).send('topic not specified');
    }
    else {
        // get a new mqttClient
        // so we dont constantly add listeners on the 'global' mqttClient
        var mqttClient = getMqttClient();

        mqttClient.on('connect', function () {
            mqttClient.subscribe(topic);
        });

        mqttClient.on('message', function (t, m) {
            if (t === topic) {
                res.write(m);
            }
        });

        req.on("close", function () {
            mqttClient.end();
        });

        req.on("end", function () {
            mqttClient.end();
        });
    }
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
