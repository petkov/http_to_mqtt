# HTTP to MQTT bridge

The idea of creating HTTP to MQTT bridge appeared when I was trying to integrate Google Assistant with my Home Assistant after watching [BRUH Automation](https://youtu.be/087tQ7Ly7f4?t=265) video. Right now there is no MQTT service available in [IFTTT](https://ifttt.com/about). Existing integration solution uses [Maker Webhooks](https://ifttt.com/maker_webhooks) which requires that your HA is publically accessible, which I think brings some security concerns or simply not always possible to set up.

The HTTP to MQTT bridge should feel that gap. The idea is to receive signals using HTTP requests and transfer them to your MQTT broker, which is connected to HA. The HTTP to MQTT bridge is written using Node JS with [Express](https://expressjs.com/) for HTTP server and [MQTT.js](https://www.npmjs.com/package/mqtt) client.

## Usage

The app could be hosted on any Node JS hosting. 

### Heroku

I prefer [Heroku: Cloud Application Platform](https://www.heroku.com/home) for its simplicity.  

1. Configure Home Assistant [MQTT trigger](https://home-assistant.io/docs/automation/trigger/#mqtt-trigger).
1. Configure [CloudMQTT](https://www.cloudmqtt.com/). Here is a great video tutorial on how to do that: https://www.youtube.com/watch?v=VaWdvVVYU3A
1. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/petkov/http_to_mqtt) HTTP to MQTT bridge app.
1. Add below (Config Variables)(https://devcenter.heroku.com/articles/config-vars#setting-up-config-vars-for-a-deployed-application) to your Heroku app.
   * AUTH_KEY - can be any string eg.: 912ec803b2ce49e4a541068d495ab570.
   * MQTT_HOST - the host of your MQTT broker (eg.: mqtts://k99.cloudmqtt.com:21234).
   * MQTT_USER
   * MQTT_PASS
1. Create IFTTT applet the same way as described in [BRUH Automation](https://youtu.be/087tQ7Ly7f4?t=265) video.
1. Configure [Maker Webhooks](https://ifttt.com/maker_webhooks) service with below parameters.
   * URL: https://<app_name>.herokuapp.com/post/
   * Method: POST
   * Content Type: application/json
   * Body: {"topic":"<mqtt_topic>","message":"<mqtt_message>","key":"<AUTH_KEY>"}
   
#### Subscribe to latest version

Additionally you can make Heroku to update HTTP to MQTT bridge app to the latest available version from GitHub repository automatically. To do this follow the instruction on [Heroku help page](https://devcenter.heroku.com/articles/github-integration#automatic-deploys).

#### Improve response time

After 30 minutes of inactivity Heroku will put your app into sleep mode. This will result in ~10 seconds response time. To prevent Heroku from putting your app into sleep mode ping it every 10 minutes or so. You can do that by sending regular HTTP GET request to http://your_app/keep_alive/. But be carefull. Heroku free quota is 550 hours per month. Without sleeping your app will be allowed to run only 22 days a month. Additionally keep_alive method will send a simple MQTT message to prevent the broker from sleeping as well. The topic and message can be configured using Heroku environment variables KEEP_ALIVE_TOPIC and KEEP_ALIVE_MESSAGE and both are set to “keep_alive” by default.


##### Home Assistant Setup
You can even configure HA to ping HTTP to MQTT bridge every 10 minutes during daytime. Below is an example of how to do that:

```yaml
rest_command:
  http_to_mqtt_keep_alive:
    url: https://<your_app_address>/keep_alive/
    method: get

automation:
  alias: HTTP to MQTT keep alive
  trigger:
    platform: time
    minutes: '/10'
    seconds: 00
  condition:
    condition: time
    after: '7:30:00'
    before: '23:59:59'
  action:
    service: rest_command.http_to_mqtt_keep_alive
```

### Use Your Own Server
You can run this on basically anything that runs NodeJS.

1.  Clone the repository
2.  Run index.js

#### Examples


##### Publish to a topic
Clone the repository and run `http_to_mqtt`.

By default the `http_to_mqtt` will listen on port 5000 and connect to the localhost MQTT Broker.  
The MQTT Broker (and other settings) can be specified by environment variables.

```bash
git clone https://github.com/petkov/http_to_mqtt.git
cd http_to_mqtt
node index.js
```

output:
```
Node app is running on port 5000
```

Publish a message to the topic 'MyTopic'
```bash
curl -H "Content-Type: application/json" "http://localhost:5000/post"  -d '{"topic" : "MyTopic", "message" : "Hello World" }'
```

output:
```
OK
```

#### Subscribe to a topic

You can subscribe to a topic.  `http_to_mqtt` will keep the connection open and wait for a messages from the MQTT Broker and will send them to the response each time a message is handled.

```bash
git clone https://github.com/petkov/http_to_mqtt.git
cd http_to_mqtt
node index.js
```

output:
```
Node app is running on port 5000
```

Publish a message to the topic 'MyTopic'.  Use `-ivs --raw` to see messages come in as they are received.
```bash
curl -ivs --raw localhost:5000/subscribe?topic=MyTopic
```

output:
```
*   Trying ::1...
* TCP_NODELAY set
* Connected to localhost (::1) port 5000 (#0)
> GET /subscribe?topic=MyTopic HTTP/1.1
> Host: localhost:5000
> User-Agent: curl/7.54.1
> Accept: */*
>
```

Whenever a message is published to the topic MyTopic curl will output the message.

Use mosquitto_pub to publish a message:
```bash
mosquitto_pub -t 'MyTopic' -m 'I sent this message using Mosquitto'
```

curl output:
```
<
23
I sent this message using Mosquitto
```

## Specific Use Cases
### Plex
Plex has the ability to specify web hooks.

We must use some query parameters to tell http_to_mqtt to handle certain things specific to our use case.
 - topic=/plex/playback : Since Plex does not know which MQTT topic to post to, we must specify that via the topic query parameter.  This can be anything.
 - single=thumb : Plex send the user's thumbnail as the 'thumb' file.  Setting the single query parameter tells http_to_mqtt to handle single file uploads.
 - path=payload : The information we care about is specified by the payload property of the JSON uploaded.  Tell http_to_mqtt that that is the message that should be published.
 
```
http://localhost:5000/post?topic=/plex/playback&single=thumb&path=payload
```

## Thanks

Special thanks to Ben from [BRUH Automation](https://www.youtube.com/channel/UCLecVrux63S6aYiErxdiy4w/featured) for awesome tutorials which inspired me to do this project.
