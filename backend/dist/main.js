"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const create_db_1 = require("./database/create-db");
const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:19006',
];
function parseCorsOrigins() {
    const rawOrigins = process.env.CORS_ORIGIN;
    if (!rawOrigins) {
        return defaultOrigins;
    }
    const parsedOrigins = rawOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return parsedOrigins.length > 0 ? parsedOrigins : defaultOrigins;
}
async function bootstrap() {
    await (0, create_db_1.ensureDatabaseExists)();
    const { AppModule } = await import('./app.module.js');
    const { auth } = await import('./auth/auth.js');
    const { toNodeHandler } = await import('better-auth/node');
    const app = await core_1.NestFactory.create(AppModule);
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: parseCorsOrigins(),
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.use('/api/auth', toNodeHandler(auth));
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port, '0.0.0.0');
    console.log(`Backend server running on http://localhost:${port}/api`);
    console.log(`Local network access: http://192.168.100.116:${port}/api`);
}
void bootstrap();
//# sourceMappingURL=main.js.map