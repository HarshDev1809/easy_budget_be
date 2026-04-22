import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js'
import authRoutes from './routes/auth.routes.js'
import cookieParser from 'cookie-parser'

const app = express();

app.use(helmet());
app.use(cors());
// app.all("/api/auth/*all", async (req, res) => {
//     console.log("Auth route hit:", req.method, req.url);
//     const handler = toNodeHandler(auth);
//     handler(req, res);
// });
app.use("/api/v1/auth", authRoutes);
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1',routes);
app.all("*all", (req, res) => {
    res.status(404).send("Global 404: Route not found");
});

export default app;
