import express from "express"
import dotenv from 'dotenv';
import ServiceRouter from "./service/ServiceRouter.js";
import redisClient from "./db/RedisClient.js";
import InstanceRouter from "./instance/InstanceRouter.js";

dotenv.config();


const port = process.env.PORT || 10000;

const app = express();
app.use(express.json());

app.use("/services",ServiceRouter);
app.use("/instances",InstanceRouter);


const server = app.listen(port, () => {
    console.log(`Load Balancer is listening on port ${port}`);
});

function gracefulShutdown(signal) {
    console.log(`Received ${signal}. Closing server...`);
    
    server.close(() => {
      console.log('Closed remaining HTTP connections.');

      redisClient.quit().then(() => {
        console.log('Closing redis connection.');
        process.exit(0);
      }).catch((err) => {
        console.error("Error closing redis connection: " , err);
        process.exit(1);
      })
    });
  
    setTimeout(() => {
      console.error('Forcefully shutting down.');
      process.exit(1);
    }, 10000);
}
  
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // For Kubernetes, Docker, etc.
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // For Ctrl+C in terminal