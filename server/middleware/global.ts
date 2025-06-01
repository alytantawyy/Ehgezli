import express from 'express';
import cors from 'cors';


// Configure CORS to allow requests from mobile app
export const corsMiddleware = cors({
  origin: [
    'http://localhost:8081', 
    'http://localhost:19006', 
    'http://localhost:19000', 
    'http://localhost:19001', 
    'http://localhost:19002', 
    'exp://localhost:8081',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://10.2.64.32:8081',
    'exp://10.2.64.32:8081',
    'exp://10.2.64.32:19000',
    'exp://10.2.64.32:19001',
    'exp://10.2.64.32:19002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Middleware to parse JSON bodies
// This allows us to read JSON data sent in POST requests
export const jsonMiddleware = express.json();

// Middleware to parse URL-encoded bodies (form data)
// extended: false means use the simple algorithm for parsing
export const urlencodedMiddleware = express.urlencoded({ extended: false });
