const express = require('express'); //back-end framework
const dotenv = require('dotenv'); //environment variables
const morgan = require('morgan'); //middleware
const connectDB = require('./config/db'); //mongo db
const errorHandler = require('./middleware/error'); // Create  DRY errorHandler
const fileUpload = require('express-fileupload') // file upload
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const rateLimit = require('express-rate-limit');


// Environment Variables
const path = require('path') // module path
const cookieParser = require('cookie-parser');
dotenv.config({ path: './config/config.env'});

// Connect to database
connectDB();

// Route files
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

// Parse JSON
app.use(express.json());
// Parse Cookie
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(fileUpload());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(cors());

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 request per 'window' (here, per 15 minutes)
});

app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

// Mount Riders
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

// must come after the route call.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
})