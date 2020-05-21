const Koa = require('koa');
const Crypto = require('crypto');
const Config = require('dotenv').config();
const Router = require('koa-router');
const BodyParser = require('koa-bodyparser');
const Winston = require('winston');
const ChatRoutes = require('./project-chat-route.json');
const TelegramService = require('./src/TelegramService.js')
const Shttps = require('socks5-https-client');


const GITLAB_MR_EVENT = 'Merge Request Hook';
const BITBUCKET_PR_EVENT = 'pr:opened';

const app = new Koa();
const router = new Router();
const bodyparser = new BodyParser();
const logger = Winston.createLogger({
  level: 'info',
  format: Winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new Winston.transports.File({ filename: 'error.log', level: 'error' }),
    new Winston.transports.File({ filename: 'combined.log' }),
  ],
});

const telegramService = new TelegramService(Config.parsed, ChatRoutes, Shttps, logger);

app.use(bodyparser);

function isAuth(ctx, config)
{
    ctx.from = GITLAB_MR_EVENT;
    return GITLAB_MR_EVENT === ctx.headers['x-gitlab-event'] && getToken(ctx) === config.SECRET_KEY;
}

function inWhiteList(ctx, config)
{
    ctx.from = BITBUCKET_PR_EVENT;
    let whiteIps = config.IP_WHITE_LIST.split(',');
    return whiteIps.indexOf(ctx.headers['x-real-ip']) > -1 && BITBUCKET_PR_EVENT === ctx.headers['x-event-key'];
}

function getToken(ctx)
{    
    return ctx.header['x-gitlab-token'];
}

app.use(async (ctx, next) => {    
    let config = Config.parsed;

    if(ctx.headers['x-event-key'] === 'diagnostics:ping'){
        ctx.status = 200;
        return;
    }

    if(!inWhiteList(ctx, config) && !isAuth(ctx, config)){
        ctx.throw(401);
    }

    next();
});

router.post('/node/merge_request', (ctx, next) => {
    telegramService.sendMsgTlg(ctx);
    ctx.status = 200;
    next();
});

router.get('/node/merge_request', (ctx, next) => {
    telegramService.sendMsgTlg(ctx);
    ctx.status = 200;
    next();
});

app
.use(router.routes())
.use(router.allowedMethods);

app.listen(3000);