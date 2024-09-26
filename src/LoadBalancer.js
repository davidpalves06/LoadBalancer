import express from "express"
import dotenv from 'dotenv';
import ServiceRouter from "./service/ServiceRouter.js";

dotenv.config();


const port = process.env.PORT || 10000;

const app = express();
app.use(express.json());

app.use("/",ServiceRouter);


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});