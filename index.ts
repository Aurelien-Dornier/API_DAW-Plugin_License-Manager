import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import { env } from './src/config/env';


const app = new Koa();
const router = new Router();

// Middlewares de bases
app.use(cors());
app.use(helmet());
app.use(bodyParser());

// Route de base pour tester
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

// router
app.use(router.routes()).use(router.allowedMethods());

// Démarrage du serveur
const port = parseInt(env.PORT);
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});