
import redisClient from "./db/RedisClient.js";

class DuplicateChecker {

    async checkDuplicate(request,service) {
        const serviceName = service.name;
        const duplicate = service.duplicate
        if (duplicate.strategy == "HEADER") {
            const name = duplicate.name;
            const requestID = request.headers[name];
            const duplicateRequest = JSON.parse(await redisClient.get(`${serviceName}:${requestID}`));
            
            if (duplicateRequest != null) {
                if (duplicateRequest.processing == true) {
                    return {duplicate: true,processing:true};
                } else {
                    return {duplicate: true,processing:false,response:duplicateRequest.response};
                }
            }
            return {duplicate:false}
        }
        if (duplicate.strategy == "FIELD") {
            const name = duplicate.name;
            const requestID = (JSON.parse(request.body))[name];
            const duplicateRequest = JSON.parse(await redisClient.get(`${serviceName}:${requestID}`));
            if (duplicateRequest != null) {
                if (duplicateRequest.processing == true) {
                    return {duplicate: true,processing:true};
                } else {
                    return {duplicate: true,processing:false,response:duplicateRequest.response};
                }
            }
            return {duplicate:false}
        }
        return {duplicate:false}
    }

    async addDuplicate(service,request) {
        const serviceName = service.name;
        const duplicate = service.duplicate;
        if (duplicate.strategy == "HEADER") {
            const name = duplicate.name;
            const requestID = request.headers[name];
            const expiration = duplicate.expiration;
            await redisClient.setEx(`${serviceName}:${requestID}`,expiration,JSON.stringify({processing:true}));
        }
        if (duplicate.strategy == "FIELD") {
            const name = duplicate.name;
            const requestID = (JSON.parse(request.body))[name];
            const expiration = duplicate.expiration;
            await redisClient.setEx(`${serviceName}:${requestID}`,expiration,JSON.stringify({processing:true}));
        }
    }

    async finishProcessing(service,request,status,headers,body){
        const serviceName = service.name;
        const duplicate = service.duplicate;
        if (duplicate.strategy == "HEADER") {
            const name = duplicate.name;
            const requestID = request.headers[name];
            const expiration = duplicate.expiration;
            await redisClient.setEx(`${serviceName}:${requestID}`,expiration,JSON.stringify({processing:false,response:{status,headers,body}}));
        }
        if (duplicate.strategy == "FIELD") {
            const name = duplicate.name;
            const requestID = (JSON.parse(request.body))[name];
            const expiration = duplicate.expiration;
            await redisClient.setEx(`${serviceName}:${requestID}`,expiration,JSON.stringify({processing:false,response:{status,headers,body}}));
        }
    }

    async removeDuplicate(service,request) {
        const serviceName = service.name;
        const duplicate = service.duplicate;
        if (duplicate.strategy == "HEADER") {
            const name = duplicate.name;
            const requestID = request.headers[name];
            await redisClient.del(`${serviceName}:${requestID}`);
        }
        if (duplicate.strategy == "FIELD") {
            const name = duplicate.name;
            const requestID = (JSON.parse(request.body))[name];
            await redisClient.del(`${serviceName}:${requestID}`);
        }
    }
}

const duplicateChecker = new DuplicateChecker()

export default duplicateChecker