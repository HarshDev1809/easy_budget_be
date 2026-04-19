import { Request,Response } from 'express';
import { sql } from 'drizzle-orm';
import db from '../../db/index.js'
import { getMessage } from '../../utils/error/getMessage.js';

export const status = async (req: Request,res : Response)=>{
        console.log("running");
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
                        error   : getMessage(error)
                });

        }
}
