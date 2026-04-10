import { sql } from 'drizzle-orm';
import db from '../../db/index.js'

export const status = async (req,res)=>{
        try{
                await db.execute(sql`SELECT 1`);

                return res.status(200).json({
                        message : "Server running successfully",
                        success : true,
                })
        }catch(error){

                console.error(error);

                return res.status(500).json({
                        message : "Internal Server Error",
                        success : false,
                        error   : error.message
                });

        }
}
