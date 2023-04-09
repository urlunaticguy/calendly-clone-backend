// routes.ts
import { Router } from 'express';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

const router = Router();

// will have to shift these into env someday
const CLIENT_ID = '367099735228-ht9dogbml97mlgel29vpqbn2nfa2jm6h.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REFRESH_TOKEN = '1//04qITGl0Wm7OhCgYIARAAGAQSNwF-L9IrxIPlOOKz5iGFPZMvfI74OU00vcFunTGGAAex07MGza63kURMHl716u-9B3dNSH2oHMU';

// Create a new OAuth2 client
const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

// Set the refresh token on the client
client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

// Get a new access token
client.getAccessToken()
  .then(({token}) => {
    console.log(`Access token: ${token}`);

    // Set the access token on the client
    client.setCredentials({
      access_token: token
    });
  })
  .catch(err => {
    console.error(`Error getting access token: ${err}`);
  });

const availabilityParamsSchema = z.object({
    hostId: z.string(),
  });

// Define the API endpoints here

router.get('/availability/:hostId', async (req, res) => {
    // code to fetch availability for host with specified ID
    // current time span is 7 days (change it in timeMax in line 54)
    // Validate the request parameters against the schema
    const { hostId } = availabilityParamsSchema.parse(req.params);

    try {
        // Fetch the calendar availability for the host with the specified ID
        const calendar = google.calendar({ version: 'v3', auth: client });
        const availability = await calendar.freebusy.query({
        requestBody: {
            timeMin: new Date().toISOString(),
            timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            timeZone: 'UTC',
            items: [{ id: hostId }],
        },
        });
        // Return the availability as the response
        const busySlots = availability.data.calendars?.[hostId]?.busy ?? [];
        res.json(busySlots);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching availability');
    }
  });

  const zodDateISOStringFormat = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

  
  // Define the schema for the request body
  const scheduleParamsSchema = z.object({
    hostId: z.string(),
    startTime: zodDateISOStringFormat,
    endTime: zodDateISOStringFormat,
    attendeeEmail: z.string().email(),
  });
  
  router.post('/schedule', async (req, res) => {
    // code to schedule a meeting

    // Validate the request body against the schema
    const { hostId, startTime, endTime, attendeeEmail } = scheduleParamsSchema.parse(
      req.body
    );

    try {
      // Create a new event with the specified parameters
      const calendar = google.calendar({ version: 'v3', auth: client });
      const event = await calendar.events.insert({
        calendarId: hostId,
        requestBody: {
          summary: 'Meeting with ' + attendeeEmail,
          start: {
            dateTime: startTime,
            timeZone: 'UTC',
          },
          end: {
            dateTime: endTime,
            timeZone: 'UTC',
          },
          attendees: [{ email: attendeeEmail }],
        },
      });

      // Return the newly created event as the response
      res.json(event.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error scheduling meeting');
    }
  });

  const meetingsParamsSchema = z.object({
    userId: z.string(),
  });
  
  router.get('/meetings/:userId', async (req, res) => {
    // code to fetch scheduled meetings for user with specified ID

    // Validate the request parameters against the schema
    const { userId } = meetingsParamsSchema.parse(req.params);

    try {
      // Fetch the list of events for the specified user ID
      const calendar = google.calendar({ version: 'v3', auth: client });
      const events = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
        q: userId,
      });

      // Map the events to a more compact format for the response
      const meetings = events.data.items.map((event) => ({
        id: event.id,
        summary: event.summary,
        start: event.start.dateTime,
        end: event.end.dateTime,
        attendees: event.attendees,
      }));

      // Return the meetings as the response
      res.json(meetings);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching meetings');
    }
  });

export default router;
