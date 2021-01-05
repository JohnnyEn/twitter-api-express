import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import session from 'express-session';

import 'module-alias/register';
import './env';

import indexRouter from './routes/index';
import usersRouter from './routes/users';
import twitterV1 from './routes/twitter-v1';
import twitterV2 from './routes/twitter-v2';

import { SESSION_SECRET } from 'babel-dotenv'

let app = express();
dotenv.config({ path: path.join(__dirname, '.env')  });

// view engine setup
app.set('views', path.join(__dirname, '../public/views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: SESSION_SECRET
  })
);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/twitter-v2', twitterV2);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
