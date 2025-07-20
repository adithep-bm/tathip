const isProd = process.env.NODE_ENV == "production";
const isDev = !isProd;

const conf = {
  isProd,
  isDev,
  apiPrefix: isProd ? "/api" : "http://10.114.139.140:8000/v1",
};

export default conf;
