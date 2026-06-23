import {env} from "./config/index.js";
import app from "./app.js";
import "./jobs/renew.worker.js";

app.listen(env.httpPort,()=>{
        console.log("Server running on ",env.httpPort);
})
