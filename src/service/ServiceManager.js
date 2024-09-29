import http from "http"

class ServiceManager {
    constructor(){
        this.services = {};
        this.servers = {};
    }

    registerService(service) {
        if (this.exists(service.name)) {
            return {success:false,err:`Service named ${service.name} already exists`};
        }
        if (this.servers[service.port] != undefined) {
            return {success:false,err:`Service port ${service.port} already occupied.`};         
        }
        this.#createServer(service.port);
        this.services[service.name] = service;
        return {success:true};
    }

    updateService(service) {
        if (!this.exists(service.name)) {
            return {success:false,err:`Service named ${service.name} not found.`};
        }
        const currPort = this.services[service.name].port;
        const newPort = service.port;
        if (newPort != currPort) {
            this.#closeServer(currPort);
            this.#createServer(newPort);
        }
        this.services[service.name] = service;
        return {success:true};
    }

    exists(serviceName) {
        return this.services[serviceName] == undefined ? false : true;
    }

    getService(serviceName) {
        return this.services[serviceName];
    }

    getAllServices() {
        return this.services;
    }

    deleteService(serviceName) {
        const service = this.services[serviceName];
        this.services[serviceName] = undefined;
        const serviceServer = this.servers[service.port];
        serviceServer.close(() => {
            console.log("Closing port");
            this.servers[service.port] = undefined;
        });
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
}

const serviceManager = new ServiceManager();

export default serviceManager;