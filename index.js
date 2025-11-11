const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// fire base 
const admin = require("firebase-admin");
const serviceAccount = require("./servicekey.json");

const app = express()
const port = 3000
app.use(cors())
app.use(express.json())


// firebase 



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});





const uri = "mongodb+srv://assignment-10:a9srgPHiQBzUmz0N@cluster0.5wfdugv.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlwere


const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];
  try {
    await admin.auth().verifyIdToken(token);

    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};



// ...........
async function run() {
  try {
    await client.connect();

    const db = client.db('assignment-10')
    const modelcollection = db.collection('all-movie')
    const watchlistcollection = db.collection('watchlist')

    //  find 
    // All movies 
    // normal page 
    app.get('/movies', async (req, res) => {
      const result = await modelcollection.find().toArray()
      res.send(result)
    })

    // details page 
    // normal page
    app.get('/movies/:id', async (req, res) => {
      const { id } = req.params
      // console.log(id)
      const objectId = new ObjectId(id)

      const result = await modelcollection.findOne({ _id: objectId })

      res.send({
        success: true,
        result
      })
    })


    // Add a new movie privetrout 
    // post mathod 
    // add movie 
    // privet page 
    app.post('/movies', async (req, res) => {
      const data = req.body
      // console.log(data)
      const result = await modelcollection.insertOne(data)

      res.send({
        success: true,
        result
      })
    })

    // put 
    // update movie 
    // privet 
    app.put('/movies/:id', async (req, res) => {
      const { id } = req.params
      const data = req.body
      // console.log(id)
      // console.log(data)
      const objectId = new ObjectId(id)
      const filter = { _id: objectId }
      const update ={
        $set:data
      }

      const result = await modelcollection.updateOne(filter,update)

      res.send({
        success: true,
        result
      })

    })

//     app.put('/movies/:id', verifyToken, async (req, res) => {
//   const { id } = req.params;
//   const data = req.body;

//   const objectId = new ObjectId(id);
//   const filter = { _id: objectId };
//   const update = { $set: data };

//   try {
//     const result = await modelcollection.updateOne(filter, update);
//     res.send({
//       success: true,
//       result
//     });
//   } catch (error) {
//     res.status(500).send({
//       success: false,
//       message: "Failed to update movie",
//       error
//     });
//   }
// });



    // delete 
    // delet data from api 
    app.delete('/movies/:id',async(req,res)=>{
        const { id } = req.params
        const objectId = new ObjectId(id)
      const filter = { _id: objectId }

      const result = await modelcollection.deleteOne(filter)

      res.send({
        success:true,
        result
      })

    })


    // Recently Added 6 data 
    app.get('/latest-movie',async(req,res)=>{

      const result =await modelcollection.find().sort({created_at: 'desc'}).limit(6).toArray()
       console.log(result)

      res.send(result)

    })



    // my collection peivet 
        
    app.get('/my-collection',verifyToken,async(req,res)=>{
      const email = req.query.email
      const result = await modelcollection.find({addedBy:email}).toArray()

      res.send(result)
    })


    // Watchlist 
    app.post("/watchlist",async(req,res)=>{
      const data =req.body
      const result = await watchlistcollection.insertOne(data)
      res.send(result)
    })

    app.get('/mywatchlist',async(req,res)=>{
      const email =req.query.email
      const result =await watchlistcollection.find({watch_by:email}).toArray()
      res.send(result)
    })

    // movie count 
  app.get('/movieCount', async (req, res) => {
    try {
    const count = await modelcollection.countDocuments(); // total movie count
    res.send({ totalMovies: count });
    } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error counting movies' });
    }
   });

  //  total user
  app.get('/userCount', async (req, res) => {
  try {
    // Firebase theke user list anbo
    const listUsers = await admin.auth().listUsers();
    const totalUsers = listUsers.users.length;
    res.send({ totalUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ message: 'Failed to get user count' });
  }
});


// hiest retade 
app.get('/highestRated', async (req, res) => {
  try {
    const movie = await modelcollection.aggregate([
      {
        $addFields: {
          numericRating: { $toDouble: "$rating" } // string → number
        }
      },
      { $sort: { numericRating: -1 } },
      { $limit: 1 }
    ]).toArray();

    if (movie.length > 0) {
      res.send({ highestRated: movie[0] });
    } else {
      res.send({ highestRated: null });
    }
  } catch (error) {
    console.error('Error fetching highest rated movie:', error);
    res.status(500).send({ message: 'Failed to get highest rated movie' });
  }
});


// mivie img
app.get('/topMovies', async (req, res) => {
  try {
    const movies = await modelcollection
      .find({}, { projection: { title: 1, posterUrl: 1, rating: 1 } })
      .sort({ rating: -1 })
      .limit(3)
      .toArray();

    res.send({ topMovies: movies });
  } catch (error) {
    console.error('Error fetching top movies:', error);
    res.status(500).send({ message: 'Failed to get top movies' });
  }
});

// yygy





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('assignment 10 is running!')
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
