import {getAdapter} from '../services/AdapterFactory.js';

export async function mergeRequestV13 (ctx, next) {
   let adaptedData = getAdapter('gitlab_mr_v13').adapt(ctx.body);
   // telegramService.sendMsgTlg(ctx);
    ctx.status = 200;
    next();
}
