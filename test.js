const express = require('express');
const multer = require('multer');
const mongodb = require('mongodb');

const app = express();
const port = 3010;

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="image">
      <input type="submit" value="Upload">
    </form>
  `);
});

app.post('/upload', upload.single('image'), async (req, res) => {
  const client = await mongodb.connect('mongodb://0.0.0.0/acebook_test');
  const db = client.db('acebook_test');
  //this will create a new collection named images - can be viewed as a database with mongodb
  const collection = db.collection('images');

  // object image is created, which is created into a binary buffer object
  const image = {
    data: Buffer.from(req.file.buffer),
    contentType: req.file.mimetype
  };

  console.log(image);
  //the image object is inseted into the image collection
  await collection.insertOne(image);
  client.close();

  res.redirect('/pictures');
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});

