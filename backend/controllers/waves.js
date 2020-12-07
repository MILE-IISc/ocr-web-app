const Wave = require("../models/wave");
const User = require("../models/user");
const fs = require('fs');
var path = require('path');

exports.createWaveList = (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  // Reading File List for the user
  let fetchedUser;
  let files = [];
  let WaveListArray = []; 
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      fetchedUser = user;
    })
    .then( () => {
      // Reading File List for the user
      const user_wav_dir = './backend/data/'+fetchedUser.email
      fs.readdir(user_wav_dir, (err, filesList) => {
        if (err) {
          files = [];
        }
        else {
          targetFiles=filesList;
          targetFiles.forEach(file => {
            if(path.extname(file).toLowerCase() === ".wav") {
              files.push(file);
              console.log("inside insert: "+file);
            }
          });
          files.forEach(file => {
            const path = url+'/data/'+fetchedUser.email+'/'+file;
            const wave={
              name: file,
              path: path,
              completed: 'N',
              editor: fetchedUser._id
            };
            WaveListArray.push(wave);
          });
          // Saving the WaveList to the Database
          Wave.insertMany(WaveListArray,function (err,data) {
            if(err!=null){
              console.log("Inserting WavesList documents failed. error: "+err);
              res.status(500).json({
                message: "Inserting WavesList documents failed !!!"
              });
            }
            else {
              //Updaing the filesListLoaded status in User's database
              User.findOneAndUpdate({ email: fetchedUser.email }, { filesListLoaded: 'Y' }, {new: true})
              .then(result => {
                if (result.filesListLoaded == "Y") {
                  console.log("User FileList Status updated succesfully. result: "+result);
                  res.status(201).json({
                    message: "Wave added successfully",
                    wave: data
                  });
                } else {
                  console.log("User FileList Status update failed. result: "+result);
                  res.status(401).json({ message: "Not authorized!" });
                }
              })
              .catch(error => {
                console.log("User FileList Status update failed. error: "+error);
                res.status(500).json({
                  message: "User FileList Status update failed !!!"
                });
              });
            }
          });
        }
      });
    });
};


exports.getWaveList = (req, res, next) => {
  const url = req.protocol + "://" + req.get("host");
  const mail = req.query.user;
  var fetchedWaves = "";
  let fetchedUser;
  let files = [];
  let WaveListArray = [];
  User.findOne({ email: mail })
  .then(user => {
    if (!user) {
      return res.status(401).json({
        message: "Auth failed"
      });
    }
    fetchedUser = user;
    // Get the list of files alloted to the user from database
    audioPath = url+'/data/'+fetchedUser.email+'/';
    Wave.find({ editor: fetchedUser._id }, function (err, documents) 
    {
      if(err!=null){
        res.status(200).json({
          message: "Fetching waves failed!",
          wave: fetchedWaves
        });
      }
      fetchedWaves = documents;
      fetchedWaves.sort((a, b) => a.name.localeCompare(b.name));
      console.log(fetchedWaves.length);
    }).then(fetchedWaves => {
      // Get the list of files alloted to the user from storage directory
      const user_wav_dir = './backend/data/'+fetchedUser.email;
      var newFiles = [];
      fs.readdir(user_wav_dir, (err, filesList) => {
        if (err) {
          files = "";
        }
        else {
          targetFiles=filesList;
          targetFiles.forEach(file => {
            if(path.extname(file).toLowerCase() === ".wav") {
              files.push(file);
            }
          });

          let oldFiles = [];
          let delFiles = [];
          newFiles = files.slice();
          
          if(fetchedWaves.length > 0) {

            if(files.length > 0) {
              fetchedWaves.map((fetchedWave) => {
                absent = 0;
                files.map((file) => {
                  if(file == fetchedWave.name) {
                    oldFiles.push(file);
                  }
                  else{
                    absent++;
                  }
                  if(file != fetchedWave.name && absent == files.length) {
                    delFiles.push(fetchedWave.name);
                  }
                })
              });
            }
            else {
              fetchedWaves.map((fetchedWave) => {
                delFiles.push(fetchedWave.name);
              });
            }
            delFiles = delFiles.filter(delFiles => !oldFiles.includes(delFiles));
          }
          else {
            if(files.length > 0) {
              newFiles = files.slice();
            }
          }

          if(files.length > 0) {
            newFiles = newFiles.filter(newFile => !oldFiles.includes(newFile));
          }
          else {
            newFiles = [];
          }
          if(delFiles.length != 0) {
            delFileId = [];
            delFiles.map((delFile) => {
              fetchedWaves.map((fetchedWave) => {
                if(delFile == fetchedWave.name) {
                  delFileId.push(fetchedWave.id);
                }
              });
            });
            Wave.deleteMany({
                _id: {
                  $in: delFileId
                },
                editor: fetchedUser._id
              }).then(result => {
                if (!result) {
                  console.log("delete failed: "+err);
                } else {
                  if(result.n > 0) {
                    console.log("delete success: "+result.n);
                  }
                }
            });
          }

          newFiles.forEach(file => {
            const path = url+'/data/'+fetchedUser.email+'/'+file;
            const wave={
              name: file,
              path: path,
              completed: 'N',
              editor: fetchedUser._id
            };
            WaveListArray.push(wave);
          });

          // Saving the new WaveList to the Database
          Wave.insertMany(WaveListArray).then((data) => {
            if(!data){
              console.log("Unable to insert data");
            }
            else{
              console.log("inserted data successfully");
            }
          }).then(() => {
            // Wave.find({editor: fetchedUser._id}).sort({"name": 1}).then(documents => 
            Wave.find({ editor: fetchedUser._id }, function (err, documents)
            {
              // err = "";
              if(err!=null){
                console.log(err);
                res.status(200).json({
                  message: "Fetching waves failed!",
                  wave: fetchedWaves
                });
              }
              fetchedWaves = documents;
              fetchedWaves.sort((a, b) => a.name.localeCompare(b.name));
              console.log("Waves fetched successfully");
  
              res.status(201).json({
                message: "Waves fetched successfully!",
                wave: fetchedWaves
              });
            });
          })
        }
      });
    });
  });
};


exports.updateTextGrid = (req, res, next) => {

  waveFileName = req.body.name;
  textFileName = waveFileName.slice(0, -3) + 'TextGrid';
  jsonString = req.body.json;
  editor = req.userData.email;
  editorId = req.userData.userId;

  const user_txt_dir = './backend/data/'+editor+'/'+textFileName;
  let writeStream = fs.createWriteStream(user_txt_dir);
  let Json = JSON.parse(jsonString);

  // fs writeStream error handling
  writeStream.on('error', (err) => {
    console.log(err);
    writeStream.end();
    res.status(500).json({
      message: "Couldn't save Text File. err: "+ err
    });
  });

  // write some data with a base64 encoding
  writeStream.write('File type = "'+Json[0].textFileType+'"', 'utf8');
  writeStream.write('\r\nobject class = "'+Json[0].textFileClass+'"', 'utf8');
  writeStream.write('\r\n', 'utf8');
  writeStream.write('\r\nxmin = '+Json[0].start, 'utf8');
  writeStream.write('\r\nxmax = '+Json[0].duration, 'utf8');
  writeStream.write('\r\ntiers? <exists>', 'utf8');
  writeStream.write('\r\nsize = 1', 'utf8');
  writeStream.write('\r\nitem []:', 'utf8');
  writeStream.write('\r\n    item [1]:', 'utf8');
  writeStream.write('\r\n        class = "'+Json[0].textGridClass+'"', 'utf8');
  writeStream.write('\r\n        name = "'+Json[0].textGridName+'"', 'utf8');
  writeStream.write('\r\n        xmin = '+Json[0].start, 'utf8');
  writeStream.write('\r\n        xmax = '+Json[0].duration, 'utf8');
  writeStream.write('\r\n        intervals: size = '+Json[0].regions, 'utf8');

  // parsing through regions inorder to write into file

  if (Json.length-1 == Json[0].regions) {
    for(i=1; i<Json.length; i++) {
      writeStream.write('\r\n            intervals ['+Json[i].regionId+']:', 'utf8');
      writeStream.write('\r\n            xmin = '+Json[i].startTime, 'utf8');
      writeStream.write('\r\n            xmax = '+Json[i].endTime, 'utf8');
      writeStream.write('\r\n            text = "'+Json[i].regionText+'"', 'utf8');
    }
  }

  // the finish event is emitted when all data has been flushed from the stream
  writeStream.on('finish', () => {
    Wave.findOneAndUpdate({ editor: editorId, name: waveFileName }, { completed: 'Y' }, {new: true})
    .then(result => {
      if (result.completed == "Y") {
        res.status(200).json({ message: "Text File saved successfully!", name: waveFileName, completed: "Y" });
      } else {
        console.log("User FileList Status update failed. result: "+result);
        res.status(401).json({ message: "Not authorized!" });
      }
    })
    .catch(error => {
      console.log("User FileList Status update failed. error: "+error);
      res.status(500).json({
        message: "User FileList Status update failed !!!"
      });
    });
  });

  // closing the fs writeStream on success
  writeStream.end();
};




// exports.getWave = (req, res, next) => {

//   const user_dir = './backend/images';

//   fs.readdir(user_dir, (err, files) => {
//     if (err) {
//       return console.log('Unable to scan directory: ' + err);
//     } 
//     files.forEach(file => {
//       console.log(file);
//     });
//   });

//   Post.findById(req.params.id)
//     .then(post => {
//       if (post) {
//         res.status(200).json(post);
//       } else {
//         res.status(404).json({ message: "Post not found!" });
//       }
//     })
//     .catch(error => {
//       res.status(500).json({
//         message: "Fetching post failed!"
//       });
//     });
// };

// exports.deleteWave = (req, res, next) => {
//   Post.deleteOne({ _id: req.params.id, creator: req.userData.userId })
//     .then(result => {
//       console.log(result);
//       if (result.n > 0) {
//         res.status(200).json({ message: "Deletion successful!" });
//       } else {
//         res.status(401).json({ message: "Not authorized!" });
//       }
//     })
//     .catch(error => {
//       res.status(500).json({
//         message: "Deleting posts failed!"
//       });
//     });
// };
