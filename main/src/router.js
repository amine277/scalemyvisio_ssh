const _ = require('lodash');


exports.routers = (app) => {


    /**
    * @method POST
    * @endpoint /api/on-live-auth
    * @description authentication for live stream user
    *
    */

   app.post('/api/on-live-auth', (req, res, next) => {


       const streamInfo = req.body;
       
       const streamSecretKey = _.get(streamInfo, 'name');
       // we can check stream_key to verify it in backend.
       console.log(`User begin streaming and we are veryfing ${streamSecretKey}`);
       // After veryfing secret streaming key and we allow user stream their video.  return http status 200.
       return res.status(200).json({
           verified: true,
       });

       //return res.status(401).json({access: false});

   });

   /**
    * @method POST
    * @endpoint /api/on-live-done
    * @description Event after user finishing streaming.
    *
    */
   app.post('/api/on-live-done', (req, res, next) => {

       const streamingKey = _.get(req, 'body.name');
       console.log(`User finishing streaming camera.`, streamingKey);

       // return http code anything does not effect to our live server.

       return res.json({
           done: true
       });

   });





}

