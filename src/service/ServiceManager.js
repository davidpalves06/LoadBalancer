import http from "http"
import redisClient from "../db/RedisClient.js";
import instanceManager from "../instance/InstanceManager.js";
import fetch from "node-fetch";

class ServiceManager {
    constructor(){
        this.servers = {};
        this.roundRobinTracker = {}
    }

    async registerService(service) {
        if (!this.exists(service.name)) {
            return {success:false,err:`Service named ${service.name} already exists`};
        }
        if (this.servers[service.port] != undefined) {
            return {success:false,err:`Service port ${service.port} already occupied.`};         
        }
        this.#createServer(service);
        service.instances = [];
        if (service.balancingStrategy == "ROUND ROBIN") {
            this.roundRobinTracker[service.name] = {tracker:0};
        }
        else if (service.balancingStrategy != "RANDOM" || service.balancingStrategy != "IN REQUEST") {
            return {success:false,err:`Balancing strategy is not known.`};     
        }
        this.#setServiceRedis(service);
        return {success:true};
    }

    async updateService(service) {
        if (!this.exists(service.name)) {
            return {success:false,err:`Service named ${service.name} not found.`};
        }
        const currentService = await this.#getServiceFromRedis(service.name);
        const currPort = currentService.port;
        const newPort = service.port;
        
        if (newPort != currPort) {
            this.#closeServer(currPort);
            this.#createServer(newPort);
        }
        this.#setServiceRedis(service);
        return {success:true};
    }

    async exists(serviceName) {
        const exists = await redisClient.exists("SERVICE:" +serviceName);
        return  exists ? true : false;
    }

    async getService(serviceName) {
        return await this.#getServiceFromRedis(serviceName);
    }

    async getAllServices() {
        let cursor = '0';
        let keys = [];
        let values = [];

        do {
            const result = await redisClient.scan(cursor);
            cursor = result.cursor;
            keys = keys.concat(result.keys.filter(key => key.startsWith("SERVICE:")));
        } while (cursor != '0');

        
        for (const key of keys) {
            const value = await JSON.parse(await redisClient.get(key));
            values.push({ ...value });
        }

        return values;
    }

    async deleteService(serviceName) {
        const service = await this.#getServiceFromRedis(serviceName);
        if (service == undefined) return undefined;
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

    #createServer(service) {
        const serviceServer = http.createServer(async (req,res) => {
            this.#handleRequest(service);
        });
        const servicePort = service.port;
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

    async bootServices() {
        const services = await this.getAllServices();
        for (const service of services) {
            this.#createServer(service);
            this.roundRobinTracker[service.name] = {tracker:0};
        }
    }

    async #handleRequest(service) {
        const requestService = await this.#getServiceFromRedis(service.name);
            const instances = requestService.instances;
            if (instances.length == 0) {
                res.writeHead(400);
                res.end("No service instances available.");
                return;
            }
            let instanceNameToSend = undefined;   
            switch (requestService.balancingStrategy) {
                case "ROUND ROBIN":
                    const currentTracker = this.roundRobinTracker[service.name].tracker;
                    instanceNameToSend = instances[currentTracker];
                    if (currentTracker == instances.length - 1) this.roundRobinTracker[service.name] = 0;
                    else this.roundRobinTracker[service.name]++;
                    break;
                case "RANDOM":
                    const randomTracker = Math.round(Math.random() * (instances.length - 1));
                    instanceNameToSend = instances[randomTracker];
                    break;
                case "IN REQUEST":
                    const specificInstance = req.headers["specific-instance"];
                    if (specificInstance == undefined) {
                        res.writeHead(400);
                        res.end("No instance specified in request");
                        return;
                    }
                    instanceNameToSend = instances.filter((instance) => instance.name == specificInstance)[0];
                    if (instanceNameToSend == undefined) {
                        res.writeHead(400);
                        res.end("Instance with specified name does not exist");
                        return;
                    }
                    break;
                default:
                    res.writeHead(400);
                    res.end("No balancing strategy available for this service");
                    return;
            }
            let instanceToSend = await instanceManager.getInstance(instanceNameToSend);
            
            await fetch(instanceToSend.location,{
                method: req.method,
                headers: {
                    ... req.headers,
                    "load_balancing_strategy": requestService.balancingStrategy,
                    "load_balancing_version" : "v1.0",
                    "load_balancing_software" : "CUSTOM_DAVID_LOAD_BALANCER"
                }
            }).then((response) => {
                res.write(response.body);
                res.writeHead(response.status,response.headers).end();
            }).catch((err) => {
                res.writeHead(500);
                res.end(`Error connecting to server : ${err.message}`)
            }); 
    }
}

const serviceManager = new ServiceManager();

export default serviceManager;