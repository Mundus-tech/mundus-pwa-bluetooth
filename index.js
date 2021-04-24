import AnimationService from "./AnimationService.js";
import config from "./config.js";

export default class MundusBluetoothService {
  constructor() {
    this.listeners = {
      press: null,
      move: null,
      step: null,
      version: null,
      batteryCharge: null,
      chargeState: null,
      leds: null,
      brightness: null,
    };
    this.server = null;
    this.services = {
      board: null,
      battery: null,
      leds: null,
    };
    this.characteristics = {
      press: null,
      move: null,
      step: null,
      version: null,
      batteryCharge: null,
      chargeState: null,
      leds: null,
      brightness: null,
    };
  }

  async connect() {
    const device = await navigator.bluetooth.requestDevice({
      filters: Object.values(config.serviceUUIDs).map((service) => ({
        services: [service.serviceUUID],
      })),
    });
    this.device = device;
    return device;
  }

  async disconnect() {
    this.server.disconnect();
  }

  async startListeners() {
    this.device.addEventListener(
      "gattserverdisconnected",
      this._onDisconnected
    );
    this.server = await this.device.gatt.connect();
    await Promise.all(
      Object.entries(config.serviceUUIDs).map(
        async ([serviceName, service]) => {
          const btService = await this.server.getPrimaryService(
            service.serviceUUID
          );
          this.services[serviceName] = btService;
          await Promise.all(
            Object.entries(service.characteristicUUIDs).map(
              async ([characteristicName, characteristicUUID]) => {
                const btCharacteristic = await btService.getCharacteristic(
                  characteristicUUID
                );
                this.characteristics[characteristicName] = btCharacteristic;
                await btCharacteristic.startNotifications();
                btCharacteristic.addEventListener(
                  "characteristicvaluechanged",
                  this._eventTriger(characteristicName)
                );
              }
            )
          );
        }
      )
    );
  }

  async read(characteristicName) {
    const data = await this.characteristics[characteristicName].readValue();
    return translateCharacteristicValue(data);
  }

  async write(characteristicName, data) {
    await this.characteristics[characteristicName].writeValueWithResponse(
      stringToArrayBuffer(data)
    );
  }

  addListenerCallback(characteristicName, callback) {
    this.listeners[characteristicName] = callback;
  }

  removeListenerCallback(characteristicName) {
    this.listeners[characteristicName] = null;
  }

  _onDisconnected(event) {
    const device = event.target;
    console.log(`Device ${device.name} is disconnected.`);
  }

  _eventTriger(eventName) {
    return (event) => {
      if (this.listeners[eventName]) {
        this.listeners[eventName](
          translateCharacteristicValue(event.target.value)
        );
      }
    };
  }
}

function translateCharacteristicValue(value) {
  const buffer = Buffer.from(value.buffer, "base64");
  const data = buffer.toString("utf8");
  return data;
}

function stringToArrayBuffer(str) {
  return new TextEncoder().encode(str);
}

export { AnimationService };
