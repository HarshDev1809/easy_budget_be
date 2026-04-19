// import { Request,Response } from 'express';
// import {defaultConfig} from '../../config/default.config.js';
// import {env} from '../../config/index.js';

// export const signin = async(req: Request,res:Response)=>{
//         try{
//                 const {email,password,name} = req.validated.body ?? {};

//                 const {db} = defaultConfig;
                
//                 let data = null;
//                 let accessToken = null;
//                 let refreshToken = null;
//                 await db.transaction(async (tx) =>{
                
//                         if(await checkUserData({...defaultConfig,db : tx, email, phoneNumber : phone_number})){
//                                 return res.status(409).json({
//                                         message : "User already exist with this Email or Phone Number",
//                                         success : false,
//                                         error : `email or phone number already taken`
//                                 })
//                         }

//                         const hashedPassword = await bcrypt.hash(password,env.saltRounds);

//                         const {id : userId} = await insertUser({...defaultConfig, db : tx,email, password : hashedPassword, name, phoneNumber : phone_number });

//                         accessToken = await generateAccessToken({userId});

//                         refreshToken = generateRefreshToken();

//                         data = await insertRefreshToken({...defaultConfig, db : tx,userId,refreshToken});

//                 })

//                 res.cookie('access_token',accessToken,{
//                         httpOnly : true,
//                         secure : env.nodeEnv === 'dev'? false :true,
//                         sameSite : 'Lax',
//                         maxAge : 15 * 60 * 1000,
//                         path : '/'
//                 });

//                 res.cookie('refresh_token',refreshToken,{
//                         httpOnly : true,
//                         secure : env.nodeEnv === 'dev'? false :true,                        sameSite : 'Strict',
//                         maxAge : 7 * 24 * 60 * 60 * 1000,
//                         path : '/auth/refresh'
//                 })

//                 return res.status(200).json({
//                         message : "User Signed up Successfully",
//                         success : true
//                 })

//         }catch(error){
//                 return res.status(error.statusCode ?? 500).json({
//                         message : "Something went wrong while signup",
//                         success : false,
//                         status : "error",
//                         error : error.message,
//                         stack : env.nodeEnv === 'dev' ? error.stack : undefined
//                 })
//         }

// }
