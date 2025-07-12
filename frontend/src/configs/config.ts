const isProd = process.env.NODE_ENV == 'production';
const isDev = !isProd;

const conf = {
  isProd,
  isDev,
  apiPrefix: isProd ? '/api' : 'http://localhost:8000/v1',
}

export default conf;