import Koa from "koa";
import { router } from "@/routes/router.js";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import helmet from "koa-helmet";
import { env } from "./config/env.js";

const app = new Koa();


// Middlewares de bases
app.use(cors());
app.use(helmet());
app.use(bodyParser());


// router
app.use(router.routes()).use(router.allowedMethods());

// Démarrage du serveur
const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
