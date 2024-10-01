import express from "express"
import instanceManager from "./InstanceManager.js";

const InstanceRouter = express.Router();

InstanceRouter.post("/",async (req,res) => {
    const {name, location,service} = req.body;
    if (name == undefined || location == undefined || service == undefined) {
        res.status(400).send("Request is malformed.")
        return;
    }
    const {success,err} = await instanceManager.registerInstance(req.body);
    if (success) res.status(201).send("Instance added.");
    else res.status(400).send(err);
});

InstanceRouter.delete("/:instanceID",async (req,res) => {
    const instanceID = req.params.instanceID;
    const removedInstance = await instanceManager.deleteInstance(instanceID);
    if (removedInstance == undefined) res.status(404).send();
    else res.status(204).send();
});

InstanceRouter.get("/:instanceID",async (req,res) => {
    const instanceID = req.params.instanceID;
    const instance = await instanceManager.getInstance(instanceID);
    if (instance != undefined) res.status(201).json(instance);
    else res.status(404).send("Instance not found.");
})

export default InstanceRouter;
