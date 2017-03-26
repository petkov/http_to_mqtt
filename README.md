# HTTP to MQTT bridge

This is a simple HTTP to MQTT bridge based on Node JS.
Can be used to integrate [IFTTT](https://ifttt.com/about) to [Home Assistant](https://home-assistant.io/) throw MQTT broker (like [CloudMQTT](https://www.cloudmqtt.com/)). Can be run in Heroku.

## Bringing pieces together

1. Configure Home Assistant [MQTT trigger](https://home-assistant.io/docs/automation/trigger/#mqtt-trigger).
1. Configure [CloudMQTT](https://www.cloudmqtt.com/). Here is a great video tutorial: https://www.youtube.com/watch?v=VaWdvVVYU3A
1. [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/petkov/http_to_mqtt) HTTP to MQTT bridge app.
1. Add below (Config Variables)(https://devcenter.heroku.com/articles/config-vars#setting-up-config-vars-for-a-deployed-application) to your Heroku app.
   * AUTH_KEY - any secret string eg.: my_secret_key.
   * MQTT_HOST (eg.: mqtts://k99.cloudmqtt.com:21234)
   * MQTT_USER
   * MQTT_PASS
1. Create IFTTT applet.
1. Configure [Maker Webhooks](https://ifttt.com/maker_webhooks) service.
   * URL: https://<app_name>.herokuapp.com/post/
   * Method: POST
   * Content Type: application/json
   * Body: {"topic":"<mqtt_topic>","message":"<message>","key":"<AUTH_KEY>"}
   
## Subscribe to latest version

Additionally you can make Heroku to redeploy the latest version of HTTP to MQTT bridge from GitHub repository automatically. The detail descriptions can be found [here](https://devcenter.heroku.com/articles/github-integration#automatic-deploys).

## Improve response time

After 30 minutes of inactivity Heroku will put your app in to sleep mode. This will result in ~10 seconds response time. To prevent Heroku from putting your app in to speep mode ping it every 10 minutes or so. You can do that using regular HTTP GET request to http://your_app/keep_alive/. But be carefull. Heroku free quota is 550 hours per month. Without sleeping your app will be allowed to run only 22 days a month. Additionaly keep_alive method will send a simple MQTT message to prevent the broker from sleeping as well. The topic and message can be configured using Heroku environment variables KEEP_ALIVE_TOPIC and KEEP_ALIVE_MESSAGE.

Bellow is an example of automation for HA to ping HTTP to MQTT bridge every 10 minutes during day time. 

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
