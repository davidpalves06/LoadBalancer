import express from "express"
import serviceManager from "./ServiceManager.js";

const ServiceRouter = express.Router();

ServiceRouter.post("/services",async (req,res) => {
    const {name, port, properties} = req.body;
    if (name == undefined || typeof port !== 'number' || isNaN(port) || port < 1024) {
        res.status(400).send("Request is malformed.")
        return;
    }
    const {success,err} = await serviceManager.registerService(req.body);
    if (success) res.status(201).send("Service Registered.");
    else res.status(400).send(err);
});


ServiceRouter.put("/services/:serviceID",async (req,res) => {
    const {name, port, properties} = req.body;
    if (name == undefined || typeof port !== 'number' || isNaN(port) || port < 1024) {
        res.status(400).send("Request is malformed.")
        return;
    }
    const {success,err} = await serviceManager.updateService(req.body);
    if (success) res.status(201).send("Service Updated.");
    else res.status(400).send(err);
});


ServiceRouter.get("/services/:serviceID",async (req,res) => {
    const serviceID = req.params.serviceID;
    const service = await serviceManager.getService(serviceID);
    if (service != undefined) res.status(201).json(service);
    else res.status(404).send("Service not found.");
});

ServiceRouter.get("/services",async (req,res) => {
    const services = await serviceManager.getAllServices();
    res.status(201).json(services);
});

ServiceRouter.delete("/services/:serviceID",(req,res) => {
    const serviceID = req.params.serviceID;
    serviceManager.deleteService(serviceID);
    res.status(204).send();
});

export default ServiceRouter;