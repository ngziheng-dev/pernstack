import { Pool } from 'pg';
import dotenv from "dotenv"
dotenv.config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: 
        process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    
});

// const pool = new Pool({
//     user: "postgres",
//     password: "ziheng",
//     host: "localhost",
//     port: 5432,
//     database: "todoapp"
// })

export default pool;