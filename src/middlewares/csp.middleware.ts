import koaHelmet from "koa-helmet";

interface CSPDirectives {
  [key: string]: string[];
}

export const cspMiddleware = () => {
  return koaHelmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          ...(process.env.NODE_ENV === "development" ? ["'unsafe-inline'"] : [])
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          ...(process.env.NODE_ENV === "development" ? ["ws:"] : [])
        ],
      } as CSPDirectives,
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });
};