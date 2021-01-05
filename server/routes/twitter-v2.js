
import express, { response } from 'express';
import https from 'https';
import util from 'util';
import axios from 'axios';

import { API_KEY, API_KEY_SECRET } from 'babel-dotenv';
import * as appConstants from '@server/constants/app-constants';
import { resolve } from 'path';

const router = express.Router();

const credentials = `${API_KEY}:${API_KEY_SECRET}`;
const credentialsBase64Encoded = Buffer.from(credentials).toString('base64');

/* GET /twitter-v2 home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Twitter V2 page' });
});

/*
  * GET: /twitter-v2/authorize
  * Authorizes application with OAUTH2 bearer token
  * Bearer is saved into req.session
  * Storing into database and de-validation of token is necessary
*/

router.get('/authorize', (req, res, next) => {
  axios({
    method: 'post',
    url: appConstants.TWITTER_V2_OAUTH_URL,
    headers: {
      'Authorization': `Basic ${credentialsBase64Encoded}`,
      'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
      'Access-Control-Allow-Origin':'*',
      'X-Requested-With':'XMLHttpRequest'
    },
    data: 'grant_type=client_credentials'
  })
    .then(response => {
      // Save token into DB everytime after reauth
      req.session.twitterV2BearerToken = response.data.access_token;
      res.status(200).send('Authorization complete')
    })
    .catch(error => {
      res.status(500).send('Error during authorization: ' + util.inspect(error));
    });
});

/*
  * GET: /twitter-v2/get-user-timeline
  * Get user time line from twitter
  * Params:
  * - userId: twitter user id
  * - maxResults: maximum tweets results count
  * Returns Object with: success, Twitter API response body and Twitter API response meta
*/

router.get('/get-user-timeline', (req, res, next) => {
  const userId = req.body.userId;
  const maxResults = req.body.maxResults;
  const twitterTimelineUrl = `${appConstants.TWITTER_V2_TIMELINES_URL}/${userId}/tweets?max_results=${maxResults}`;

  let responseBody = {};

  axios.get(twitterTimelineUrl, {
    headers: { 'Authorization': `Bearer ${req.session.twitterV2BearerToken}` }
  })
    .then(response => {
      responseBody = response.data;

      res.status(200).send({
        "success": true,
        "body": responseBody
      });
    })
    .catch(error => {
      res.status(500).send('problem with query or request: ', error);
    });
});

/**
 * GET: localhost:3000/twitter-v2/filter-tweets
 * IMPORTANT:
 * This endpoint is operated by adding or removing rules from the Twitter API via POST endpoints
 * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction
 *
*/

router.get('/filter-tweets', (req, res, next) => {
  const credentials = `${process.env.API_KEY}:${process.env.API_KEY_SECRET}`;
  const credentialsBase64Encoded = Buffer.from(credentials).toString('base64');

  axios({
    method: 'post',
    url: appConstants.TWITTER_V2_OAUTH_URL,
    headers: {
      'Authorization': `Basic ${credentialsBase64Encoded}`,
      'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
      'Access-Control-Allow-Origin':'*',
      'X-Requested-With':'XMLHttpRequest'
    },
    data: 'grant_type=client_credentials'
  })
    .then((response) => {
      const bearerToken = response.data.access_token;

      https
        .get(
          appConstants.TWITTER_V2_STREAM_URL,
          { headers: { 'Authorization': `Bearer ${bearerToken}` } },
          (response) => {
            response.on('data', (response) => {
              process.stdout.write(response);
            })
            response.on('error', (error) => {
              console.log('something went wrong: ', error);
            })

            return response;
        })
        .on('error', error => {
          console.log(error);
        });
    })
    .catch(error => {
      console.log('There is something wrong:');
      console.log(error);
      res.status(error.request.res.statusCode).send(error.request.res.statusMessage);
    })
});

/**
 * IMPORTANT:
 * This endpoint is operated by adding or removing rules from the Twitter API via POST endpoints
 * https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction
 *
 * Request body: object with property "add" or "delete"
 * adding is handled with Twitter API operators (from: userId, #, @, etc) in object "add",
 * removing is handled by array "ids" inside "delete" object
 * further info visit project Postman or official Twitter V2 API docs
 *
*/

router.post('/set-filtered-stream-rules', (req, res) => {
  axios({
    method: 'post',
    url: appConstants.TWITTER_V2_OAUTH_URL,
    headers: {
      'Authorization': `Basic ${credentialsBase64Encoded}`,
      'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
      'Access-Control-Allow-Origin':'*',
      'X-Requested-With':'XMLHttpRequest'
    },
    data: req.body.requestObject
  })
    .then(response => {
      res.send(response);
    })
    .catch(error => {
      console.log(error);
    })
});

/*
 * GET: localhost:3000/twitter-v2/check-active-rules
 *
 * Returns query in object of active rules for filtered tweet search
 * No params
*/

router.get('/check-active-rules', (req, res) => {
  axios.get(appConstants.TWITTER_V2_ACTIVE_STREAM_RULES, {
    headers: {
      'Authorization': `Bearer ${req.session.twitterV2BearerToken}`
    }
  })
    .then(response => {
      res.send(response.data);
    })
    .catch(error => {
      console.log(error);
      res.send(error);
    });
});

module.exports = router;
