import Router from 'koa-router';
import Config from 'dotenv';
import {gitLabAuthorize} from './auth.js';
import * as GitlabController from './controllers/GitlabController.js';



const config = Config.config().parsed;
const gitlabRoutes = new Router();

gitlabRoutes
    .use(gitLabAuthorize());

gitlabRoutes.get('/merge_request/v13', GitlabController.mergeRequestV13);


const router = new Router({prefix:config.PREFIX_PATH});
router.use('/gitlab', gitlabRoutes.routes(), gitlabRoutes.allowedMethods());

export function routes () { return router.routes() }
