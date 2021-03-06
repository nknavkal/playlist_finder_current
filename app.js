/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
require('dotenv').config();
// var client_id = '6450a42517584193831cbdc7616406ec'; // Your client id
// var client_secret = '4e57ce393d4e4a0ba110fd8c035749aa'; // Your secret
// var redirect_uri = 'http://localhost:8888/shabbadoo'; // Your redirect uri

//TODO: make .env work so im not revealing stuff
var client_id = process.env.ID; // Your client id
var client_secret = process.env.SECRET; // Your secret
var redirect_uri = process.env.REDIRECT; // Your redirect uri
var TOKEN = 0;
var URL = 'https://api.spotify.com/v1/me';
var playlistsToTracks = {};
var playlist_id = 0;
var totalTracks = 0;

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/shabbadoo', function(req, res) {
  //this redirect URI is set in app settings on developer.spotify.com

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: { 
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;
        TOKEN = access_token;
        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }

    });
  }
});
async function getTracks(playlistID, numTracks, access_token) {
  console.log("started getTracks")
  var tracks = [];
  var trackCount = 0;
  var base_url = 'https://api.spotify.com/v1/playlists/' + playlistID + '/tracks';
  var options = {
    url: base_url,
    headers: { 'Authorization': 'Bearer ' + access_token},
    json: true
  };
  var batch = []
  if(trackCount != numTracks) {
    let tracksBatch = await request.get(options, function(error, response, body) {
      console.log("now entering await block after req for tracks");
      console.log("iterating over tracks");
      body.items.forEach((someTrack)=> {
        batch.push(someTrack.track.name);
      });
      console.log("here's the batch: ");
      console.log(batch);
      return batch
    });
    console.log("--------------------------------------------------------------------------------");
    console.log("now to return the batch:")
    // options.url = base_url + '&offset=' + trackCount;
    // request.get(options, async function(error, response, body) {
    //   trackCount += body.items.length;
    //   for (const item of body.items) {
    //     var track = item.track.name;
    //     console.log(track);
    //     tracks.push(track)
    //   }
    // });
    return batch;
  }
}

function getPlaylist() {
  var playlists = [];

  var optionsGet = {
    url: 'https://api.spotify.com/v1/me/playlists?limit=1',
    headers: { 'Authorization': 'Bearer ' + TOKEN},
    json: true
  };

  request.get(optionsGet, async function(error, response, body) {
    for(let i = 0; i<body.items.length; i++) {
      var playlist = body.items[i];
      console.log(playlist);
      console.log("*********************************************");

      // var tracks = [];
      // var playlistOptions = {
      //   url: playlist.tracks.href,
      //   headers: { 'Authorization': 'Bearer ' + access_token},
      //   json: true
      // };
      // await request.get(playlistOptions, async function(error, response, body) {
      //   for(const item of body.items) {
      //     var track = await item.track.name;
      //     console.log(track + " track")
      //     await tracks.push(track);
      //     // console.log(tracks);
      //   }
  
      // });
      // console.log(tracks + " should print after tracklist?");
      console.log("title:" + playlist.name + "!!!!!!!!!!!!");
      console.log("now entering getTracks: ");
      // var trx = await getTracks(playlist.id, playlist.tracks.total, access_token);
      // console.log(trx);
      // playlistsToTracks[playlist.name] = getTracks(playlist.id, playlist.tracks.total, access_token);
      //TODO: get tracks from tracks API
    };
    // TODO: loop to get more playlists, can use the next field in the playlists req
    console.log("playlistsToTracks, should come after the track names");
    playlist_id = playlist.id;
    totalTracks = playlist.tracks.total;
  })
}


app.get('/get_playlist', function(req, res) {
  getPlaylist();
});

app.get('/get_tracks', function(req,res) {
    getTracks(playlist_id, totalTracks, TOKEN);
  });


app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
