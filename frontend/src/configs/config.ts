const isProd = process.env.NODE_ENV == "production";
const isDev = !isProd;

const conf = {
  isProd,
  isDev,
  apiPrefix: isProd ? "/api" : import.meta.env.VITE_API_PREFIX,
};

export default conf;
