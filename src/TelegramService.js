class TelegramService {
    constructor(config, routes, shttpClient, logger) {
        this.config = config;
        this.chatRoutes = routes;
        this.shttpClient = shttpClient;
        this.logger = logger
    }

    sendMsgTlg(ctx){

        if(cantToSend(ctx)){
            return;
        }

        let msg = implodeMsg(extractData(ctx));
        let chats = getChats(ctx, this.chatRoutes);   
                
        for (const key in chats) {
            sendTo(msg, chats[key], this.config, this.shttpClient, this.logger);
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
const BITBUCKET_PR_EVENT = 'pr:opened';
const GITLAB_MERGE_REQUEST_STATUS = 'unchecked';

const TlgApiHost = 'api.telegram.org'
const botMessageRegex = /\[\[\[.+?\]\]\]/g


function cantToSend (ctx){
    if(ctx.from === GITLAB_MR_EVENT && 
        ctx.request.body.object_attributes.merge_status !== GITLAB_MERGE_REQUEST_STATUS){
            return true;
    }

    return false
}


function sendTo(msg, to, config, client, logger){
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
            return  'bucket:' + ctx.request.body.pullRequest.fromRef.repository.project.id
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
                'user': body.actor.displayName,
                'project': body.pullRequest.fromRef.repository.project.name,
                'description': extractStringForBot(body.pullRequest.description),
                'metainfo': extractStringForBot(body.pullRequest.fromRef.repository.project.description),
                'url': body.pullRequest.links.self[0].href,
                'sourse':body.pullRequest.fromRef.displayId,
                'target':body.pullRequest.toRef.displayId,
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