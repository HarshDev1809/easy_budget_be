import 'dotenv/config';

const config = {
        http_port : process.env.HTTP_PORT,
        database_url : process.env.DATABASE_URL,
        database_direct_url : process.env.DIRECT_URL
}

export default config;
