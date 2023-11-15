import express from 'express';
import path from 'path';
import morgan from 'morgan';
import 'colors';
import './config/load.js';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cors from 'cors';
import { fileURLToPath } from 'url';
import mongoSanitize from 'express-mongo-sanitize';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { checkDbIndexes } from './utils/check-db-indexes.js';
import errorHandler from './middleware/error.js';

// Route files
import bootcamps from './bootcamp/bootcamp-routes.js';
import courses from './course/course-routes.js';
import auth from './auth/auth-routes.js';
import users from './user/user-routes.js';
import reviews from './review/review-routes.js';

checkDbIndexes();

const app = express();

// Body parser
app.use(express.json());

app.use(cookieParser());
// middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(fileUpload());

// security
app.use(mongoSanitize()); // nosql injection
const normalHelmet = helmet.contentSecurityPolicy({
  directives: {
    scriptSrc: ["'self'"],
  },
});

const laxHelmet = helmet.contentSecurityPolicy({
  directives: {
    scriptSrc: null,
    defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
  },
});

app.use(normalHelmet); // misc security-related headers
app.use(xss());
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);
app.use(hpp()); // http param pollution

app.use(cors());

app.use(laxHelmet, express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

// Errors
app.use(errorHandler);

app.get('/', (req, res) => {
  res.send('Hello from express');
});
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
      .bold
  )
);

process.on('unhandledRejection', (err: Error, promise: Promise<any>) => {
  console.log(`Bootcamp API Error: ${err.message}`.red.bold);
  server.close(() => process.exit(1));
});
