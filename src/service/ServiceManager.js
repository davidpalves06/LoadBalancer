import http from "http"
import redisClient from "../db/RedisClient.js";

class ServiceManager {
    constructor(){
        this.servers = {};
    }

    async registerService(service) {
        if (!this.exists(service.name)) {
            return {success:false,err:`Service named ${service.name} already exists`};
        }
        if (this.servers[service.port] != undefined) {
            return {success:false,err:`Service port ${service.port} already occupied.`};         
        }
        this.#createServer(service.port);
        service.instances = [];
        this.#setServiceRedis(service);
        return {success:true};
    }

    async updateService(service) {
        if (!this.exists(service.name)) {
            return {success:false,err:`Service named ${service.name} not found.`};
        }
        const currentService = this.#getServiceFromRedis(service.name);
        const currPort = currentService.port;
        const newPort = service.port;
        if (newPort != currPort) {
            this.#closeServer(currPort);
            this.#createServer(newPort);
        }
        service.instances = [];
        this.#setServiceRedis(service);
        return {success:true};
    }

    async exists(serviceName) {
        const exists = await redisClient.exists("SERVICE:" +serviceName);
        return  exists ? true : false;
    }

    async getService(serviceName) {
        return this.#getServiceFromRedis(serviceName);
    }

    async getAllServices() {
        let cursor = '0';
        let keys = [];
        let values = [];

        do {
            const result = await redisClient.scan(cursor);
            cursor = result.cursor;
            keys = keys.concat(result.keys);
        } while (cursor != '0');

        
        for (const key of keys) {
            const value = this.#getServiceFromRedis(key);
            values.push({ key, value });
        }

        return values;
    }

    async deleteService(serviceName) {
        const service = this.#getServiceFromRedis(serviceName);
        await redisClient.del("SERVICE:" + serviceName);
        this.#closeServer(service.port);
        return service;
    }

    #closeServer(servicePort) {
        const oldServer = this.servers[servicePort];
        oldServer.close(() => {
            console.log(`Closing port ${servicePort}`);
            this.servers[servicePort] = undefined;
        });
    }

    #createServer(servicePort) {
        const serviceServer = http.createServer((req,res) => {
            //TODO: Proxy request
            res.writeHead(200);
            res.end("Not implemented yet...")
        });
        this.servers[servicePort] = serviceServer;
        serviceServer.listen(servicePort,() => {
            console.log(`Starting listening to requests on port ${servicePort}.`);
        });
    }

    async #setServiceRedis(service) {
        await redisClient.set("SERVICE:" + service.name,JSON.stringify(service));
    }

    async #getServiceFromRedis(serviceName) {
        return JSON.parse(await redisClient.get("SERVICE:" +serviceName));
    }
}

const serviceManager = new ServiceManager();

export default serviceManager;