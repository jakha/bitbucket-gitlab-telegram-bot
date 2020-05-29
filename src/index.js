import Koa from 'koa';
import Config from 'dotenv';
import {routes} from './routes';
import BodyParser from 'koa-bodyparser';

//logger
// const Winston = require('winston');
// const Shttps = require('socks5-https-client');

// const logger = Winston.createLogger({
//   level: 'info',
//   format: Winston.format.json(),
//   defaultMeta: { service: 'user-service' },
//   transports: [
//     new Winston.transports.File({ filename: 'error.log', level: 'error' }),
//     new Winston.transports.File({ filename: 'combined.log' }),
//   ],
// }); 

const config = Config.config().parsed;
const app = new Koa();
const bodyparser = new BodyParser();

app.use(bodyparser);
app.use(routes());
// .use(router.allowedMethods);


app.listen(config.LISTEN_PORT);
