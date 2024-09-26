import http from "http"

class ServiceManager {
    constructor(){
        this.services = {};
        this.servers = {};
    }

    registerService(service) {
        if (this.exists(service.name)) {
            console.log(`Service named ${service.name} already exists`);
            return false;
        }
        const serviceServer = http.createServer((req,res) => {
            //TODO: Proxy request
            res.writeHead(200);
            res.end("Not implemented yet...")
        });
        this.servers[service.port] = serviceServer;
        serviceServer.listen(service.port,() => {
            console.log(`Starting listening to requests on port ${service.port} for service ${service.name}`);
        });
        this.services[service.name] = service;
        return true;
    }

    updateService(service) {
        if (!this.exists(service.name)) {
            console.log(`Service named ${service.name} not found.`);
            return false;
        }
        //TODO: LOGIC WHEN UPDATING A SERVICE INFORMATION
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

}

const serviceManager = new ServiceManager();

export default serviceManager;