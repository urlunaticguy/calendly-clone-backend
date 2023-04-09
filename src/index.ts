import express from 'express';
import mongoose from 'mongoose';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import router from './routes';

const app = express();

const swaggerDefinition = {
  swagger: '2.0',
  info: {
    title: 'Calendly Alt',
    version: '1.0.0',
    description: 'API for Calendly Alt'
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http', 'https'],
  paths: {
    '/api/availability/{hostId}': {
      get: {
        tags: ['Get the availability of the Host'],
        description: 'Endpoint 1 description',
        parameters: [
          {
            name: 'hostId',
            in: 'path',
            description: 'Email address of the host',
            required: true,
            type: 'string'
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            schema: {
              type: 'object',
              properties: {
                availableDates: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request'
          }
        }
      }
    },
    '/api/schedule': {
      post: {
        tags: ['Schedule an appointment'],
        description: 'Endpoint 2 description',
        parameters: [
          {
            name: 'appointment',
            in: 'body',
            description: 'The appointment to be created',
            required: true,
            schema: {
              type: 'object',
              properties: {
                hostId: {
                  type: 'string (host gmail)'
                },
                startTime: {
                  type: 'string (date)'
                },
                endTime: {
                  type: 'string (date)'
                },
                attendeeEmail: {
                  type: 'string (attendee gmail)'
                }
              }
            }
          }
        ],
        responses: {
          '201': {
            description: 'Created',
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string'
                },
                appointment: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string'
                    },
                    host: {
                      type: 'string'
                    },
                    guest: {
                      type: 'string'
                    },
                    date: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request'
          }
        }
      }
    },
  }
};


const options = {
  swaggerDefinition,
  apis: ['./routes.ts']
};
  
const swaggerSpec = swaggerJsdoc(options);
  
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());

// Connect to the database
mongoose.connect('mongodb://localhost:27017/calendly')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB', error)); 

// Use the API routes
app.use('/api', router);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
