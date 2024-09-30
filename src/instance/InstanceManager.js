import redisClient from "../db/RedisClient.js"
import serviceManager from "../service/ServiceManager.js";

class InstanceManager {
    constructor() {
    }

    async registerInstance(instance) {
        const serviceName = instance.service;
        const service = serviceManager.getService(serviceName);
        if (service == undefined) {
            return {success:false,err:"Service not found. Could not add instance"}
        }
        if (this.exists(instance.name)) {
            return {success:false,err:"Instance with same name already exists"}
        }
        
        const instances = service.instances;
        for (const instanceID of instances) {
            const serviceInstance = this.getInstance(instanceID);
            if (serviceInstance.location == instance.location) {
                return {success:false,err:"Instance with same location already exists"};
            }
        }

        instances.push(instance.name);
        service.instances = instances;
        await serviceManager.updateService(service);
        this.#setInstanceRedis(instance);
        return {success:true};
    }

    async deleteInstance(instanceID) {
        const serviceInstance = this.getInstance(instanceID);
        const service = await serviceManager.getService(serviceInstance.service);
        const instances = service.instances;
        instances = instances.filter(instance => instance != instanceID);
        service.instances = instances;
        await serviceManager.updateService(service);
        await redisClient.del("INSTANCE:"+instanceID);
        return serviceInstance;
    }

    async getInstance(instance) {
        return this.#getInstanceFromRedis(instance);
    }

    async exists(instanceName) {
        return await redisClient.exists("INSTANCE:" + instanceName) ? true : false;
    }

    async #setInstanceRedis(instance) {
        await redisClient.set("INSTANCE:"+ instance.name,JSON.stringify(instance));
    }

    async #getInstanceFromRedis() {
        return JSON.parse(await redisClient.get("INSTANCE:"+ instance))
    }
}

const instanceManager = new InstanceManager();

export default instanceManager;