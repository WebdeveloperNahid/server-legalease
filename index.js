const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;

//from - dontenv
require("dotenv").config();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const hiringRequestCollection = database.collection("hiringRequests");

    //for Home page to show 6 data use--> by fee (b-a) & limite (6) a
    app.get("/api/public/featured-lawyers", async (req, res) => {
      try {
        const topLawyers = await addNewLawyerCollection
          .find({})
          .sort({ _id: -1 })
          .limit(6)
          .toArray();

        res.status(200).json(topLawyers);
      } catch (error) {
        console.error("Error fetching top experts in backend:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // 🚀 Extra Section 1 – "Top Legal Experts" (Display 3 lawyers)
    app.get("/api/public/top-experts", async (req, res) => {
      try {
        const topLawyers = await addNewLawyerCollection
          .find({})
          .sort({ fee: -1 })
          .limit(3)
          .toArray();

        res.status(200).json(topLawyers);
      } catch (error) {
        console.error("Error fetching top experts in backend:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    app.get("/api/public/lawyers", async (req, res) => {
      try {
        const { search, specialty, availability } = req.query;
        let query = {};

        if (search) {
          query.name = { $regex: search, $options: "i" };
        }

        if (specialty) {
          query.specialization = { $regex: `^${specialty}$`, $options: "i" };
        }

        if (availability) {
          query.availability = { $regex: `^${availability}$`, $options: "i" };
        }

        const result = await addNewLawyerCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    //  সিঙ্গেল লয়ারের প্রোফাইল ডিটেইলস পাওয়ার API
    app.get("/api/public/lawyer/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await addNewLawyerCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!result) {
          return res.status(404).send({ message: "Lawyer not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    app.get("/api/my/addLawyers", async (req, res) => {
      const query = {};
      if (req.query.lawyerId) {
        query.lawyerId = req.query.lawyerId;
      }
      const result = await addNewLawyerCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/api/addLawyers", async (req, res) => {
      try {
        console.log("Incoming Lawyer Data:", req.body);

        const addLawyer = {
          ...req.body,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await addNewLawyerCollection.insertOne(addLawyer);

        res.status(200).send(result);
      } catch (error) {
        console.error("ADD LAWYER ERROR:", error);

        res.status(500).send({
          message: "Failed to add lawyer",
          error: error.message,
        });
      }
    });

    //update prfile er jonno

    app.patch("/api/addLawyers/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;

      delete updateData._id;

      const result = await addNewLawyerCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } },
      );

      res.send(result);
    });

    app.delete("/api/addLawyers/:id", async (req, res) => {
      const { id } = req.params;

      const result = await addNewLawyerCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    //New collection for bakend Tripe pament system management
    // 1️ নতুন Hiring Request তৈরি
    app.post("/api/hiring-requests", async (req, res) => {
      try {
        const newHiringRequest = {
          ...req.body,
          status: "pending",
          requestDate: new Date(),
        };

        const result =
          await hiringRequestCollection.insertOne(newHiringRequest);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

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
