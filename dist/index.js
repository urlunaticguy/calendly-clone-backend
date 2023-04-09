"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Calendly API',
            version: '1.0.0',
        },
    },
    apis: ['build/**/*.ts'], // You can specify the path to your route files here
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// Connect to the database
mongoose_1.default.connect('mongodb://localhost:27017/calendly', {
// useNewUrlParser: true,
// useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB', error));
// Use the API routes
app.use('/api', routes_1.default);
// Use Swagger to document the API
// const swaggerDocument = require('./swagger.json');
// app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
