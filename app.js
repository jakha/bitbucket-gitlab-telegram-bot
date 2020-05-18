const Koa = require('koa');
const Crypto = require('crypto');
const Config = require('dotenv').config();
const Router = require('koa-router');
const BodyParser = require('koa-bodyparser');
const Shttps = require('socks5-https-client');
const Winston = require('winston');

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



const TlgApiHost = 'api.telegram.org'
const botMessageRegex = /\[\[\[.+?\]\]\]/g

app.use(bodyparser);



function sendMsgTlg(msg, config)
{
    let chats = config.TELEGRAM_CHATS_IDS.split(',');

    for (const key in chats) {
       sendTo(msg, chats[key], config);
    }
}

function sendTo(msg, to, config){
    const endpoint = '/' + getIdentifier(config) + '/sendMessage?chat_id=' + to 
    + '&text=' + encodeURIComponent(msg);    

    Shttps.get(getOptions(endpoint, config), function(res) {
        res.setEncoding('utf8');
        res.on('readable', function() {
            logger.info(res.read());
        });
    });
}

function getUpdatesTlg(config){
    const endpoint = host + '/' + getIdentifier(Config) + '/getUpdates';
    Https.get(getOptions(endpoint, config), res => {
        console.log(res.headers);
    });
}

function getOptions(path, config){
    return {
        hostname: TlgApiHost,
        path: path,
        socksHost: config.SOCKS_HOST,
        socksPort: config.SOCKS_PORT,
        socksUsername: config.SOCKS_USERNAME,
        socksPassword: config.SOCKS_PASSWORD,
    };
}

function isAuth(token, config)
{
    return token === config.parsed.SECRET_KEY;
}

function getToken(ctx)
{    
    return ctx.header['x-gitlab-token'];
}

function extractStringForBot(data)
{
    if(data === '') {
        return '';
    }

    dataMatch = data.match(botMessageRegex);

    if(dataMatch === null){
        return '';
    }
    
    let msgArr = [...dataMatch];

    return msgArr.map( value => {
        return value.substr(3, value.length - 6);
    }).join('\n');
}

function getIdentifier(config)
{
    return 'bot' + config.TELEGRAM_BOT_ID;
}

function extractData(body){
    return {
        'user': body.user.name,
        'project': body.project.name,
        'description': extractStringForBot(body.object_attributes.description),
        'metainfo': extractStringForBot(body.project.description),
        'url': body.object_attributes.url,
        'sourse':body.object_attributes.source_branch,
        'target':body.object_attributes.target_branch,
        'WIP': body.object_attributes.work_in_progress
    };
}

function implodeMsg(data) {
    return data.metainfo + '\n\n'
    + data.description + '\n\n'
    + data.url + '\n\n'
    + 'Пользователь: ' + data.user + '\n'
    + 'Проект: ' + data.project + '\n';
}

app.use(async (ctx, next) => {
    ! isAuth(getToken(ctx),Config) && ctx.throw(401);
    next();
});

router.get('/node/merge_request', (ctx, next) => {
    let data = extractData(ctx.request.body);
    sendMsgTlg(implodeMsg(data), Config.parsed);
    ctx.status = 200;
    next();
});

app
.use(router.routes())
.use(router.allowedMethods);

app.listen(3000);