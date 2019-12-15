FROM alpine AS builder

# Download QEMU, see https://github.com/docker/hub-feedback/issues/1261
ENV QEMU_URL https://github.com/balena-io/qemu/releases/download/v3.0.0%2Bresin/qemu-3.0.0+resin-arm.tar.gz
RUN apk add curl && curl -L ${QEMU_URL} | tar zxvf - -C . --strip-components 1

# Set the base image
FROM arm32v7/node:alpine

# Add QEMU
COPY --from=builder qemu-arm-static /usr/bin

# File Author / Maintainer
MAINTAINER Vilius Simonaitis

# Copy the application folder inside the container
ADD . /http_to_mqtt

# Set environment prameters
ENV AUTH_KEY=912ec803b2ce49e4a541068d495ab570
ENV MQTT_HOST=mqtts://localhost:1883
ENV MQTT_USER=user
ENV MQTT_PASS=pass

# Expose ports
EXPOSE 5000

# Set the default directory where CMD will execute
WORKDIR /http_to_mqtt

RUN npm install --production --quiet

# Set the default command to execute 
CMD ["npm", "start"]

