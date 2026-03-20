import { Pool } from 'pg';
export declare const auth: import("better-auth", { with: { "resolution-mode": "import" } }).Auth<{
    appName: string;
    baseURL: string;
    secret: string;
    trustedOrigins: string[];
    database: Pool;
    emailAndPassword: {
        enabled: true;
        minPasswordLength: number;
    };
    advancedCookie: {
        useSecureCookies: boolean;
    };
    user: {
        additionalFields: {
            role: {
                type: "string";
                required: true;
                defaultValue: string;
            };
            phone: {
                type: "string";
                required: false;
            };
        };
    };
}>;
