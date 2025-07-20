const isProd = process.env.NODE_ENV == 'production';
const isDev = !isProd;

const conf = {
  isProd,
  isDev,
  apiPrefix: isProd ? '/v1' : import.meta.env.VITE_API_PREFIX,
}


export default conf;