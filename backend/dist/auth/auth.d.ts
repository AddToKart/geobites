export declare const auth: import("better-auth", { with: { "resolution-mode": "import" } }).Auth<{
    appName: string;
    baseURL: string;
    secret: string;
    trustedOrigins: string[];
    database: any;
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
            storeName: {
                type: "string";
                required: false;
            };
            businessPermit: {
                type: "string";
                required: false;
            };
            vehicleType: {
                type: "string";
                required: false;
            };
            licenseNumber: {
                type: "string";
                required: false;
            };
            street: {
                type: "string";
                required: false;
            };
            barangay: {
                type: "string";
                required: false;
            };
            landmark: {
                type: "string";
                required: false;
            };
            deliveryLat: {
                type: "string";
                required: false;
            };
            deliveryLng: {
                type: "string";
                required: false;
            };
        };
    };
}>;
