import {env} from "./config/index.js";
import app from "./app.js";
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

async function main() {
    const client = postgres(env.databaseUrl)
    const db = drizzle({ client });
}

main();

app.listen(env.httpPort,()=>{
        console.log("Server running on ",env.httpPort);
})
