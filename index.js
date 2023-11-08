const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const port = process.env.PORT || 5000;
//  middleware
app.use(express.json());
app.use(cookieParser());
app.use(
    cors(
        {
            origin: ["http://localhost:5173"],
            credentials: true
        }
    ));


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6nq2qod.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    });
}
async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db("groupStudyDB").collection("users");
        const assignmentCollection = client.db("groupStudyDB").collection("assignments");
        const SubmittedCollection = client.db("groupStudyDB").collection("submissions");
        const faqCollection = client.db("groupStudyDB").collection("faqs");


        // auth api
        app.post('/jwt', async (req, res) => {
            const body = req.body;
            console.log('user for token', body);
            const token = jwt.sign(body, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            console.log('user for token', token);
            res.cookie('token', token,
                {
                    httpOnly: true,
                    secure: false,
                    // sameSite: 'none'

                })
                .send({ success: true });
        })


        app.get('/user',verifyToken, async (req, res) => {
            const users = userCollection.find();
            const result = await users.toArray();
            res.send(result);
        })

        app.post('/user', async (req, res) => {
            const newUser = req.body;
            const result = await userCollection.insertOne(newUser);
            res.send(result);
        })

        // Assignment CRUD
        app.post('/assignment', async (req, res) => {
            const newAssignment = req.body;
            const result = await assignmentCollection.insertOne(newAssignment);
            res.send(result);
        })

        app.get('/assignment', async (req, res) => {
            const getAssignment = assignmentCollection.find();
            const result = await getAssignment.toArray();
            res.send(result);
        })
        app.get('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            console.log('id'.id);
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.findOne(query);
            res.send(result);
          })
        app.delete('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) }
            const result = await assignmentCollection.deleteOne(query);
            res.send(result);
          })

          app.put('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateAssignment = req.body;
            const Assignment = {
              $set: {
               ...updateAssignment
              }
            }
            const result = await assignmentCollection.updateOne(filter, Assignment);
            res.send(result);
          })

        //   submitted assignment
        app.post('/take-assignment', async (req, res) => {
            const newSubmitted = req.body;
            const result = await SubmittedCollection.insertOne(newSubmitted);
            res.send(result);
        })
        app.get('/take-assignment', async (req, res) => {
            const getAssignment = SubmittedCollection.find();
            const result = await getAssignment.toArray();
            res.send(result);
        })


        // FAQs
        app.get('/faqs', async (req, res) => {
            const faq = faqCollection.find();
            const result = await faq.toArray();
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Group Study is on live.....')
})

app.listen(port, () => {
    console.log(`Group Study  server is on port ${port}`);
})