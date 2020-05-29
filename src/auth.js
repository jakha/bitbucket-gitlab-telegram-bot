import Config from 'dotenv';

const config = Config.config().parsed;

function isValidToken(ctx) {
    return ctx.headers['x-gitlab-token'] === config.SECRET_KEY;
}

export function gitLabAuthorize () {
    return async (ctx, next) => {
	if(!isValidToken(ctx)) {
	    ctx.throw(401);
	}
	next();
    }
}

function inWhiteList(ctx, config)
{
    ctx.from = BITBUCKET_PR_EVENT;
    let whiteIps = config.IP_WHITE_LIST.split(',');
    return whiteIps.indexOf(ctx.headers['x-real-ip']) > -1 && BITBUCKET_PR_EVENT === ctx.headers['x-event-key'];
}
