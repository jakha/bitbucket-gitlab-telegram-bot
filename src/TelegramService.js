class TelegramService {
    constructor(config, routes, shttpClient) {
        this.config = config;
        this.chatRoutes = routes;
        this.shttpClient = shttpClient;
    }

    sendMsgTlg(ctx){
        let msg = implodeMsg(extractData(ctx));
        let chats = getChats(ctx, this.chatRoutes);
        for (const key in chats) {
            sendTo(msg, chats[key], this.config, this.shttpClient);
        }
    }

    getUpdTlg(){
        const endpoint = TlgApiHost + '/' + getIdentifier(this.config) + '/getUpdates';
        this.shttpClient.get(getOptions(endpoint, this.config), res => {
            console.log(res.headers);
        });
    }
}



const GITLAB_MR_EVENT = 'Merge Request Hook';
const BITBUCKET_PR_EVENT = 'pullrequest: created';

const TlgApiHost = 'api.telegram.org'
const botMessageRegex = /\[\[\[.+?\]\]\]/g


function sendTo(msg, to, config, client){
    const endpoint = '/' + getIdentifier(config) + '/sendMessage?chat_id=' + to 
    + '&text=' + encodeURIComponent(msg);    
    
    client.get(getOptions(endpoint, config), function(res) {
        res.setEncoding('utf8');
        res.on('readable', function() {
            logger.info(res.read());
        }); 
    });
}

function getChats(ctx, routes){
    let ident = formIdent(ctx);
    if( ident in routes){
        return routes[ident];
    }

    return routes['default'];
}

function formIdent(ctx){
    switch (ctx.from) {
        case GITLAB_MR_EVENT:
            return 'lab:' + ctx.request.body.project.id;
        case BITBUCKET_PR_EVENT: 
            return  'bucket:' + ctx.request.body.repository.uuid;
    };
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

function extractData(ctx){
    let body = ctx.request.body;
    switch (ctx.from) {
        case GITLAB_MR_EVENT:
            return  {
                'user': body.user.name,
                'project': body.project.name,
                'description': extractStringForBot(body.object_attributes.description),
                'metainfo': extractStringForBot(body.project.description),
                'url': body.object_attributes.url,
                'sourse':body.object_attributes.source_branch,
                'target':body.object_attributes.target_branch,
            };
        case BITBUCKET_PR_EVENT:
            return  {
                'user': body.pullrequest.author.display_name,
                'project': body.repository.project.name,
                'description': extractStringForBot(body.pullrequest.description),
                'metainfo': '',
                'url': body.pullrequest.links.html.href,
                'sourse':body.pullrequest.source.branch.name,
                'target':body.pullrequest.destination.branch.name,
            };
    };
}

function implodeMsg(data) 
{
    return getMsgHeader(data)
    + getMsgBody(data)
    + getMsgFooter(data);
}

function getMsgHeader(data){
    return data.metainfo + '\n\n';
}

function getMsgBody(data){
    return  data.description + '\n\n'
        + data.url + '\n\n';
}

function getMsgFooter(data){
    return 'Пользователь: ' + data.user + '\n'
    + 'Проект: ' + data.project + '\n';
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

module.exports = TelegramService;