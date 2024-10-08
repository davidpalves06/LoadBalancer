# Custom Load Balancer
This project was made so I could understand Load Balancers (reverse proxy) better. The goal was to learn various features of a Load Balancer and how could I implement them.  
<br/>
<br/>
**Features that were implemented**:
- Load Balancing (RANDOM, ROUND ROBIN, IN REQUEST)
- Rate Limit
- Duplicate Manager

<br/>

## Services and Instances

Services can be registered as well as instances related to one Service. The service tells the load balancer where to listen to that service requests and then calls one of the service instances following the service balancing strategy.

Example of a message to register a service:
```
{
    "name":"Service Name",
    "port": 2000,
    "balancingStrategy": "RANDOM",
    "rateLimit":{
        "seconds": 10,
        "limit": 5
    },
    "duplicate": {
        "strategy":"HEADER",
        "name":"request-id",
        "expiration":10
    }
}
```
<br/>

Example of a message to register instance:
```
{
    name:"INSTANCE NAME",
    location:"INSTANCE URL",
    healthPath: "/checkAlive",
    service: "Service Name"
}
```
<br/>
If a instance stops responding to the health checks, it will be removed and will no longer receive requests.
<br/>

## How to start the application
To run the load balancer, redis needs to be available. You can use docker to deploy it with this command:
```
docker run --rm -d --name redis-stack -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

To start the application, you can run the following command:
```
npm run start
```
### Environment Configuration
The redis url and the load balancer port can be defined in a .env file.
Example:
```
PORT=10000
REDIS='redis://localhost:6379'
```

***In the future, I will do load testing and add a health dashboard to the load balancer where the user can see running services, instances and other informations.***
