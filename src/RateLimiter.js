
class RateLimiter {
    constructor() {
        this.rateByUser = {}
    }

    checkRateLimit(request,serviceRate) {
        if (serviceRate == undefined) return true

        const userIP = request.ip;
        const currentTime = Date.now()
        const rateTime = serviceRate.seconds * 1000
        const rateLimit = serviceRate.limit

        let userRate = this.rateByUser[userIP];
        if (userRate == undefined) {
            this.rateByUser[userIP],userRate = []
        }

        userRate.push(currentTime);
        userRate = userRate.filter(timestamp => {
            return currentTime - timestamp <= rateTime;
        });
        
        const rateCount = userRate.length;
        this.rateByUser[userIP] = userRate;
        if (rateCount > rateLimit) {
            return false
        }

        return true
    }
}

const rateLimiter = new RateLimiter()
export default rateLimiter