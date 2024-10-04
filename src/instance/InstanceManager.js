import fetch from "node-fetch";
import redisClient, { releaseLock,acquireLock } from "../db/RedisClient.js"
import serviceManager from "../service/ServiceManager.js";

const redisLockKey = "INSTANCELOCK"
const HEARTBEAT_INTERVAL = 2000
class InstanceManager {
    constructor() {
        this.periodicChecks = {}
    }

    async registerInstance(instance) {
        const serviceName = instance.service;
        let lock = await acquireLock(redisLockKey)
        while (!lock) {
            await sleep(50);
            lock = await acquireLock(redisLockKey);
        }
        const service = await serviceManager.getService(serviceName);
        if (service == undefined) {
            return {success:false,err:"Service not found. Could not add instance"}
        }
        if (await this.exists(instance.name)) {
            return {success:false,err:"Instance with same name already exists"}
        }
        
        const instances = service.instances;
        for (const instanceID of instances) {
            const serviceInstance = await this.getInstance(instanceID);
            if (serviceInstance.location == instance.location) {
                return {success:false,err:"Instance with same location already exists"};
            }
        }
        instances.push(instance.name);
        service.instances = instances;
        await serviceManager.updateService(service);
        if (instance.healthPath == undefined) instance.healthPath = "/health"
        this.#setInstanceRedis(instance);
        await releaseLock(redisLockKey);
        this.#startServicePeriodicHealthCheck(instance.name)
        return {success:true};
    }

    async deleteInstance(instanceID) {
        let lock = await acquireLock(redisLockKey)
        while (!lock) {
            await sleep(50);
            lock = await acquireLock(redisLockKey);
        }
        const serviceInstance = await this.getInstance(instanceID);
        if (serviceInstance == undefined) return undefined;
        const service = await serviceManager.getService(serviceInstance.service);
        const instances = service.instances.filter(instance => instance != instanceID);
        service.instances = instances;
        await serviceManager.updateService(service);
        await redisClient.del("INSTANCE:"+instanceID);
        await releaseLock(redisLockKey);
        this.#stopServicePeriodicHealthCheck(instanceID);
        return serviceInstance;
    }

    async getInstance(instance) {
        return this.#getInstanceFromRedis(instance);
    }

    async exists(instanceName) {
        const exists = await redisClient.exists("INSTANCE:" + instanceName) ? true : false;
        return exists;
    }

    async #setInstanceRedis(instance) {
        await redisClient.set("INSTANCE:"+ instance.name,JSON.stringify(instance));
    }

    async #getInstanceFromRedis(instance) {
        return JSON.parse(await redisClient.get("INSTANCE:"+ instance))
    }

    bootstrapInstance(instanceID) {
        this.#startServicePeriodicHealthCheck(instanceID)
    }

    #startServicePeriodicHealthCheck(instanceID) {
        const intervalTimer = setInterval(async () => {
            const instance = await this.getInstance(instanceID);
            await fetch(instance.location + instance.healthPath,{
                method:"GET"
            }).then(async (response) => {
                if (response.status != 200) {
                    console.log(`Instance ${instanceID} is not healthy`);
                    await this.deleteInstance(instanceID);
                    this.#stopServicePeriodicHealthCheck(instanceID);
                }
            }).catch(async (err) => {
                console.log(`Instance ${instanceID} is not healthy due to error with code ${err.code}`);
                await this.deleteInstance(instanceID);
                this.#stopServicePeriodicHealthCheck(instanceID);
            });
        }, HEARTBEAT_INTERVAL);
        this.periodicChecks[instanceID] = intervalTimer;
    }

    #stopServicePeriodicHealthCheck(instanceID) {
        clearInterval(this.periodicChecks[instanceID])
        this.periodicChecks[instanceID] = undefined
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  

const instanceManager = new InstanceManager();

export default instanceManager;