import { Context, Next } from "koa";
import sanitize from "sanitize-html";


// Cette interface permet d'avoir des objets qui peuvent contenir des strings, d'autres objets, 
// des tableaux ou n'importe quel autre type
interface RecursiveObject {
  [key: string]: string | RecursiveObject | RecursiveObject[] | any;
}

export const sanitizeMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  // Fonction récursive qui nettoie les données
  const sanitizeRecursively = (obj: RecursiveObject): RecursiveObject => {
    // Si l'objet n'est pas un objet ou est null, on le retourne tel quel
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    
    // Si l'objet est un tableau, on applique la fonction récursivement sur chaque élément
    if (Array.isArray(obj)) {
      return obj.map(sanitizeRecursively);
    }
    
    // Pour un objet, on crée un nouvel objet pour stocker les valeurs nettoyées
    const result: RecursiveObject = {};
    // On parcourt chaque propriété de l'objet
    for (const [key, value] of Object.entries(obj)) {
      // Si la valeur est une chaîne de caractères, on la nettoie avec sanitize-html
      if (typeof value === "string") {
        result[key] = sanitize(value);
      } else {
        // Sinon, on applique la fonction récursivement
        result[key] = sanitizeRecursively(value);
      }
    }
    return result;
  };

  // On applique la fonction de nettoyage sur le body de la requête
  ctx.request.body = sanitizeRecursively(ctx.request.body);
  // On passe au middleware suivant
  await next();
};