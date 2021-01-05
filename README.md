# twitter-api-express
Test prototype for learning how to use Twitter API

#Features:
- Express.js API starter
- Transpiling from ES6 to ES5 with Babel
- Watching files with nodemon
- Sample routes for twitter V2 API
- URL constants are not in the .env due the public github state
# GET User timeline
- localhost:3000/get-user-timeline
- body JSON params:
-- userId - Twitter user ID obtainable via Twitter V2 API
-- maxResults - integer with desired max results for API response
# GET Search Tweets
- localhost:3000/search-tweets
- body JSON params:
--
