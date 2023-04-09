"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes.ts
const express_1 = require("express");
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
require('dotenv').config();
const availabilityParamsSchema = zod_1.z.object({
    hostId: zod_1.z.string(),
});
// Define the API endpoints here
// router.get('/testroute', (req, res) => {
//   res.json({"test":"hello world!"})
// })
router.get('/availability/:hostId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // code to fetch availability for host with specified ID
    // Validate the request parameters against the schema
    const { hostId } = availabilityParamsSchema.parse(req.params);
    // Create a new OAuth2 client with the Google credentials
    const oauth2Client = new google_auth_library_1.OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
    // Set the access token for the OAuth2 client
    oauth2Client.setCredentials({
        access_token: (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1],
    });
    try {
        // Fetch the calendar availability for the host with the specified ID
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const availability = yield calendar.freebusy.query({
            requestBody: {
                timeMin: new Date().toISOString(),
                timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                timeZone: 'UTC',
                items: [{ id: hostId }],
            },
        });
        // Return the availability as the response
        const busySlots = (_d = (_c = (_b = availability.data.calendars) === null || _b === void 0 ? void 0 : _b[hostId]) === null || _c === void 0 ? void 0 : _c.busy) !== null && _d !== void 0 ? _d : [];
        res.json(busySlots);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error fetching availability');
    }
}));
const zodDateISOStringFormat = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
// Define the schema for the request body
// const scheduleParamsSchema = z.object({
//   hostId: z.string(),
//   startTime: zodDateISOStringFormat,
//   endTime: zodDateISOStringFormat,
//   attendeeEmail: z.string().email(),
// });
router.post('/schedule', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // code to schedule a meeting
    var _e;
    // Validate the request body against the schema
    console.log(req.body);
    const { hostId, startTime, endTime, attendeeEmail } = req.body;
    // Create a new OAuth2 client with the Google credentials
    const oauth2Client = new google_auth_library_1.OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
    // Set the access token for the OAuth2 client
    oauth2Client.setCredentials({
        access_token: (_e = req.headers.authorization) === null || _e === void 0 ? void 0 : _e.split(' ')[1],
    });
    try {
        // Create a new event with the specified parameters
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const event = yield calendar.events.insert({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error scheduling meeting');
    }
}));
const meetingsParamsSchema = zod_1.z.object({
    userId: zod_1.z.string(),
});
router.get('/meetings/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // code to fetch scheduled meetings for user with specified ID
    var _f;
    // Validate the request parameters against the schema
    const { userId } = meetingsParamsSchema.parse(req.params);
    // Create a new OAuth2 client with the Google credentials
    const oauth2Client = new google_auth_library_1.OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    });
    // Set the access token for the OAuth2 client
    oauth2Client.setCredentials({
        access_token: (_f = req.headers.authorization) === null || _f === void 0 ? void 0 : _f.split(' ')[1],
    });
    try {
        // Fetch the list of events for the specified user ID
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        const events = yield calendar.events.list({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error fetching meetings');
    }
}));
exports.default = router;
