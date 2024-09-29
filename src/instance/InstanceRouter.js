import express from "express"

const InstanceRouter = express.Router();

InstanceRouter.post("/instances/",(req,res) => {
    //TODO: REGISTER INSTANCE 
});

InstanceRouter.delete("/instances/:instanceID",(req,res) => {
    //TODO: UNREGISTER INSTANCE
});

InstanceRouter.get("/instances/:instanceID",(req,res) => {
    //TODO: Get Instance
})

export default InstanceRouter;
