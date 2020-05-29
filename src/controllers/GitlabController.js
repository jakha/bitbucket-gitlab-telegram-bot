import {getAdapter} from '../services/AdapterFactory.js';

export async function mergeRequestV13 (ctx, next) {    
    const adapter = await getAdapter('gitlab_mr_v13');
    let adaptData = adapter.adapt(ctx.request.body);
    ctx.status = 200;
    next();
}
