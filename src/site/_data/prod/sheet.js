const axios  = require('axios');
const seed   = require('../../../utils/save-seed.js');
var cloudinary = require('cloudinary').v2;
// const util = require('util')

cloudinary.config({
  cloud_name: 'xxx',
  api_key: 123,
  api_secret: 'xxx'
});

// Once a googel sheet is "published to the web" we can access its JSON
// via a URL of this form. We just need to pass in the ID of the sheet
// which we can find in the URL of the document.
const sheetID = "1-NybP86OkJBO8YvElnEdcqZMt5jxJF_ScxT0Qh2Dhnk";
const googleSheetUrl = `https://spreadsheets.google.com/feeds/list/${sheetID}/od6/public/values?alt=json`;

module.exports = () => {
  return new Promise((resolve, reject) => {

    console.log(`Requesting data from ${googleSheetUrl}`);

    // cloudinary.uploader.explicit('IMG_6503', 
    // { 
    // type: 'upload', 
    //    image_metadata: 'true' 
    // }, function(err, data) { 
    //    console.log(err);    
    //    console.log(data); 
    // });

    axios.get(googleSheetUrl)
      .then(response => {
        // massage the data from the Google Sheets API into
        // a shape that will more convenient for us in our SSG.
        var data = {
          "content": []
        };
        response.data.feed.entry.forEach(item => {
          data.content.push({
            "id": item.gsx$id.$t,
            "name": item.gsx$name.$t,
            "notes": item.gsx$notes.$t,
            "links": item.gsx$links.$t, 
            "img": item.gsx$img.$t,
            "created": "",
            "lat": "",
            "lon": ""           
          })
        });

        for(var i = 0; i < data.content.length; i++) {
          var n = data.content[i]["img"];
          var temp = [];
            cloudinary.uploader.explicit(n, 
            { 
            type: 'upload',
             image_metadata: 'true' 
            }, function(err, data) { 
             addImgData(data["public_id"], data["created_at"]);
            });
        }

      function addImgData(imgName, imgDate){
        console.log(imgName, imgDate);
        for(var i = 0; i < data.content.length; i++) {
            if (data.content[i].img == imgName) {
                data.content[i]["created"] = imgDate;
                // console.log(data.content);
                // break;
            }
            else {
              finish();
            }
        }
      }

      function finish(){

        // stash the data locally for developing without
        // needing to hit the API each time.
        seed(JSON.stringify(data), `${__dirname}/../dev/sheet.json`);

        // resolve the promise and return the data
        resolve(data);

        }
      })

      // uh-oh. Handle any errrors we might encounter
        .catch(error => {
          console.log('Error :', error);
          reject(error);
        });
  })
}
