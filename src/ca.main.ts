import { router } from "./routes";
import { configs } from "./configs";
import { connectMongo } from "./database";
import { Application, NextFunction, Router } from "express";
import express = require("express");


export const ok = (data: any) => {
    return { status: HttpStatus.OK, data: data };
};
export const created = (data: any) => {
    return { status: HttpStatus.CREATED, data: data };
};

export const noContent = () => {
    return { status: HttpStatus.NO_CONTENT, data: undefined };
};

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    NO_CONTENT = 204,

    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,

    INTERNAL_SERVER = 500,
}

export type Any = any;

export interface ResultSuccess {
    status: HttpStatus;
    data: Any;
}

export interface ResultError {
    status: HttpStatus;
    code?: string;
    description?: {
        vi: string;
        en: string;
    };
    errors?: ErrorDetail[];
    details?: Any;
}

export interface ErrorData {
    errorCode: string;
    description: {
        en: string;
        vi: string;
    };
}

export class HttpError extends Error {
    constructor(public error: ResultError) {
        super();
        this.error = error;
    }
}

export interface ErrorDetail {
    location?: string;
    value?: Any;
    param?: string;
    message?: string;
}

export type Result = ResultSuccess | ResultError;
export interface Middleware {
    (req: Request, res: Response, next: NextFunction): void;
}

export const syntax = (e: SyntaxError): ResultError => {
    return {
        status: HttpStatus.INTERNAL_SERVER,
        code: "BODY_JSON_SYNTAX",
        errors: [
            {
                location: "body",
                message: e.message,
            },
        ],
    };
};

export const exception = (e: Error): ResultError => {
    let stack = e.stack?.split("\n");
    stack = stack?.map((s) => s.trim());
    return {
        status: HttpStatus.INTERNAL_SERVER,
        code: "INTERNAL_SERVER_ERROR",
        errors: [
            {
                location: e.name,
                message: e.message,
                value: stack,
            },
        ],
    };
};



const resultMiddlewares  = (env?: string): Middleware => {
    const func = (
        result: Result | Error,
        request: Request,
        response: Response,
        _: NextFunction
    ): void => {
        let data: ResultError | ResultSuccess;
        if (result instanceof SyntaxError) {
            data = syntax(result);
        } else if (result instanceof HttpError) {
            data = result.error;
        } else if (result instanceof Error) {
            console.error("%O", result);
            data = exception(result);
        } else {
            data = result;
        }
        // handleResult(data, request, response, env);
    };
    return func as NextFunction;
};

const createApp = (applicationRouter: Router, env?: string): Application => {
    const app: Application = express();
    app.use(applicationRouter);
    // app.use(resultMiddlewares(env));
    return app;
};

function main(): void {
    const host = configs.express.host;
    const port = configs.express.port;
    const environment = configs.environment;

    const startApp = (): void => {
        const app = createApp(router, environment);
        app.listen(Number(port), host, () => {
            console.info("Listening on: %s:%d", host, port);
        });
    };
    connectMongo(() => {
        // if (connectedToRedis()) {
        startApp();
        // }
    });
    // connectRedis(() => {
    //     if (connectedToMongo()) {
    //         startApp();
    //     }
    // });
}

main();
