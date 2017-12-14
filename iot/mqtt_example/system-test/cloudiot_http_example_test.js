/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const path = require(`path`);
const PubSub = require(`@google-cloud/pubsub`);
const test = require(`ava`);
const tools = require(`@google-cloud/nodejs-repo-tools`);
const uuid = require(`uuid`);

const deviceId = `test-node-device`;
const topicName = `nodejs-docs-samples-test-iot-${uuid.v4()}`;
const registryName = `nodejs-test-registry-iot-${uuid.v4()}`;
const helper = `node ../manager/manager.js`;
const cmd = `node cloudiot_mqtt_example_nodejs.js `;
const cmdSuffix = ` --num_messages=1 --private_key_file=resources/rsa_private.pem --algorithm=RS256`;
const cwd = path.join(__dirname, `..`);


test.before(tools.checkCredentials);
test.before(async () => {
  const pubsub = PubSub();
  return pubsub.createTopic(topicName)
    .then((results) => {
      const topic = results[0];
      console.log(`Topic ${topic.name} created.`);
      return topic;
    });
});

test.after.always(async () => {
  const pubsub = PubSub();
  const topic = pubsub.topic(topicName);
  return topic.delete()
    .then(() => {
      console.log(`Topic ${topic.name} deleted.`);
    });
});

test(`should receive configuration message`, async (t) => {
  const localDevice = `test-rsa-device`;
  const localRegName = `${registryName}-rsa256`;

  let output = await tools.runAsync(`${helper} setupIotTopic ${topicName}`, cwd);
  output = await tools.runAsync(
      `${helper} createRegistry ${localRegName} ${topicName}`, cwd);
  output = await tools.runAsync(
      `${helper} createRsa256Device ${localDevice} ${localRegName} resources/rsa_cert.pem`, cwd);
  t.regex(output, new RegExp(`Created device`));

  output = await tools.runAsync(
     `${cmd}  --message_type=events --registry_id="${localRegName}" --device_id="${localDevice}" ${cmdSuffix}`,
     cwd);
  t.regex(output, new RegExp(`message received`));

  // Check / cleanup
  output = await tools.runAsync(
      `${helper} getDeviceState ${localDevice} ${localRegName}`, cwd);
  t.regex(output, new RegExp(`State`));
  output = await tools.runAsync(
      `${helper} deleteDevice ${localDevice} ${localRegName}`, cwd);
  t.regex(output, new RegExp(`Successfully deleted device`));
  output = await tools.runAsync(`${helper} deleteRegistry ${localRegName}`, cwd);
});

test(`should send event message`, async (t) => {
  const localDevice = `test-rsa-device`;
  const localRegName = `${registryName}-rsa256`;
  let output = await tools.runAsync(`${helper} setupIotTopic ${topicName}`, cwd);
  output = await tools.runAsync(
      `${helper} createRegistry ${localRegName} ${topicName}`, cwd);
  output = await tools.runAsync(
      `${helper} createRsa256Device ${localDevice} ${localRegName} resources/rsa_cert.pem`, cwd);

  output = await tools.runAsync(
     `${cmd} --message_type=events --registry_id="${localRegName}" --device_id="${localDevice}" ${cmdSuffix}`,
     cwd);
  t.regex(output, new RegExp(`Publishing message:`));

  // Check / cleanup
  output = await tools.runAsync(
      `${helper} getDeviceState ${localDevice} ${localRegName}`, cwd);
  output = await tools.runAsync(
      `${helper} deleteDevice ${localDevice} ${localRegName}`, cwd);
  output = await tools.runAsync(`${helper} deleteRegistry ${localRegName}`, cwd);
});

test(`should send event message`, async (t) => {
  const localDevice = `test-rsa-device`;
  const localRegName = `${registryName}-rsa256`;
  let output = await tools.runAsync(`${helper} setupIotTopic ${topicName}`, cwd);
  output = await tools.runAsync(
      `${helper} createRegistry ${localRegName} ${topicName}`, cwd);
  output = await tools.runAsync(
      `${helper} createRsa256Device ${localDevice} ${localRegName} resources/rsa_cert.pem`, cwd);

  output = await tools.runAsync(
     `${cmd} --message_type=state --registry_id="${localRegName}" --device_id="${localDevice}" ${cmdSuffix}`,
     cwd);
  t.regex(output, new RegExp(`Publishing message:`));

  // Check / cleanup
  output = await tools.runAsync(
      `${helper} getDeviceState ${localDevice} ${localRegName}`, cwd);
  output = await tools.runAsync(
      `${helper} deleteDevice ${localDevice} ${localRegName}`, cwd);
  output = await tools.runAsync(`${helper} deleteRegistry ${localRegName}`, cwd);
});
