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
    const paymentCollection = database.collection("payments");
    const commentCollection = database.collection("comments");
    const userCollection = database.collection("user");

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
    // 1️⃣ নতুন Hiring Request তৈরি
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

    // 2️⃣ User-এর নিজের   Hiring History { getUserHiringHistory }  (/dashboard/user/hiring-history)
    app.get("/api/hiring-requests/user/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const result = await hiringRequestCollection
          .find({ userId })
          .sort({ requestDate: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // 3️⃣ একটা নির্দিষ্ট Hiring Request আনা (id দিয়ে) — pay page এর জন্য লাগবে
    // ব্যাকএন্ড কোড:
    app.get("/api/hiring-requests/:id", async (req, res) => {
      try {
        const id = req.params.id;

        console.log("Searching for ID:", id);

        const result = await hiringRequestCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          console.log("No data found for this ID");
          return res.send(null);
        }

        res.send(result);
      } catch (error) {
        console.error("DB Error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    //Payment related Api transition id etc info post get ________----

    app.post("/api/payments", async (req, res) => {
      try {
        const data = req.body;

        // একই Stripe session দিয়ে দ্বিতীয়বার insert আটকানো (duplicate check)
        // if (data.sessionId) {
        //   const existing = await paymentCollection.findOne({
        //     sessionId: data.sessionId,
        //   });
        //   if (existing) {
        //     return res.status(200).send(existing);
        //   }
        // }

        const paymentInfo = {
          ...data,
          createdAt: new Date(),
        };
        const result = await paymentCollection.insertOne(paymentInfo);
        //for Admin pay------>>>>

        if (data.paymentType === "publishing") {
          await userCollection.updateOne(
            { email: data.email },
            {
              $set: {
                publishingPaid: true,
                publishingPaidAt: data.paidAt,
                publishingTransactionId: result.insertedId.toString(),
              },
            },
          );
        }

        //--------------------------------<<<<<

        //   — hiringRequest-এর status "paid" করা  Update method use kore
        if (data.hiringRequestId) {
          await hiringRequestCollection.updateOne(
            { _id: new ObjectId(data.hiringRequestId) },
            {
              $set: {
                paymentStatus: "paid",
                paidAt: data.paidAt,
                transactionId: result.insertedId,
              },
            },
          );
        }

        res.status(201).send(result);
      } catch (error) {
        console.error("PAYMENT SAVE ERROR:", error);
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // OnerTiem publish Layer profile ---to pay Admin

    app.get("/api/users/publishing-status", async (req, res) => {
      const { email } = req.query;
      const user = await userCollection.findOne({ email });
      res.send({ publishingPaid: user?.publishingPaid || false });
    });

    // Comment section User /Client er

    // 1️⃣ নতুন Comment তৈরি (Create) — hiring record check করে
    app.post("/api/comments", async (req, res) => {
      try {
        const { hiringRequestId, lawyerId, userId, userName, comment } =
          req.body;

        //  Backend-এও verify করা — শুধু frontend check trust করা যাবে না
        const hiringRequest = await hiringRequestCollection.findOne({
          _id: new ObjectId(hiringRequestId),
        });

        if (!hiringRequest) {
          return res.status(404).send({ message: "Hiring request not found" });
        }
        if (hiringRequest.userId !== userId) {
          return res.status(403).send({ message: "Not authorized" });
        }
        if (hiringRequest.paymentStatus !== "paid") {
          return res
            .status(403)
            .send({ message: "Only paid clients can leave a review" });
        }

        const newComment = {
          hiringRequestId,
          lawyerId,
          userId,
          userName,
          comment,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await commentCollection.insertOne(newComment);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    // 2️⃣ একটা lawyer-এর সব comment (lawyer profile page-এ দেখানোর জন্য) — Read
    app.get("/api/comments/lawyer/:lawyerId", async (req, res) => {
      try {
        const { lawyerId } = req.params;
        const result = await commentCollection
          .find({ lawyerId })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });
    // 3️⃣ Logged-in user-এর নিজের সব comment (/dashboard/user/comments) — Read
    app.get("/api/comments/user/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        const result = await commentCollection
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });
    // 4️⃣ Comment আপডেট (Update)
    // app.patch("/api/comments/:id", async (req, res) => {
    //   try {
    //     const { id } = req.params;
    //     const { comment } = req.body;

    //     const result = await commentCollection.updateOne(
    //       { _id: new ObjectId(id) },
    //       { $set: { comment, updatedAt: new Date() } },
    //     );
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ message: "Server error", error: error.message });
    //   }
    // });

    // // 5️⃣ Comment ডিলিট (Delete)
    // app.delete("/api/comments/:id", async (req, res) => {
    //   try {
    //     const { id } = req.params;
    //     const result = await commentCollection.deleteOne({
    //       _id: new ObjectId(id),
    //     });
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ message: "Server error", error: error.message });
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
