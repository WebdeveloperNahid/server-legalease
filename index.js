const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;

//from - dontenv
require("dotenv").config();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//from MongoDb -------*--->>

const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    //DataCollection-Creating.....
    const database = client.db("legalease");
    const addNewLawyerCollection = database.collection("newLawyers");

    app.get("/api/my/addLawyers", async (req, res) => {
      const query = {};
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      const result = await addNewLawyerCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/addLawyers", async (req, res) => {
      const addLawyer = req.body;
      const result = await addNewLawyerCollection.insertOne(addLawyer);
      res.send(result);
    });

    // app.post("/api/addLawyers", async (req, res) => {
    //   try {
    //     const addLawyer = req.body;
    //     const result = await addNewLawyerCollection.insertOne(addLawyer);

    //     // 💡 এখানে ট্রিক! মঙ্গোডিবির জটিল ObjectId-কে প্লেইন স্ট্রিং বানিয়ে দিচ্ছি
    //     if (result && result.insertedId) {
    //       return res.status(201).json({
    //         acknowledged: result.acknowledged,
    //         insertedId: result.insertedId.toString(), // প্লেইন স্ট্রিং করা হলো
    //       });
    //     }

    //     res.status(400).json({ success: false, message: "Failed to insert" });
    //   } catch (error) {
    //     console.error("Error inserting lawyer:", error);
    //     res.status(500).json({ error: error.message });
    //   }
    // });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//end from mongodb  <<==

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
