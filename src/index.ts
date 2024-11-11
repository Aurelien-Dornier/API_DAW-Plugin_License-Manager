import { env } from "./config/env";
import Koa from "koa";
import { cspMiddleware } from "./middlewares/csp.middleware";
import { contentTypeCheck } from "./middlewares/contentType.middleware";
import { sanitizeMiddleware } from "./middlewares/sanitize.middleware";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { bodyParser } from "@koa/bodyparser";
import { router } from "./routes/router";
import helmet from "koa-helmet";

const app = new Koa();


//* Middlewares de bases
app.use(helmet());                  // Protections de sécurité de base
app.use(cspMiddleware());            // Politique de sécurité du contenu
app.use(contentTypeCheck);            // Vérification du type de contenu
app.use(corsMiddleware());            // Gestion des requêtes cross-origin

//* Middlewares de parsing
app.use(bodyParser());                // Analyse du corps de la requête
app.use(sanitizeMiddleware);          // Nettoyage des entrées utilisateur

//* Routes
app.use(router.routes()).use(router.allowedMethods());

//* Démarrage du serveur
const port = env.PORT;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
