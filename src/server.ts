import { ApolloServer } from "apollo-server-express";
import * as Express from "express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import * as Mongoose from "mongoose";
import { config } from "dotenv";

// Bc of esModuleInterop flague ts
import session = require("express-session");
import cors = require("cors");

// Bc ts-node-dev doesnt pick up any file that is not included in a entry file
require("./types/modules/session");

// Resolvers
import { UserResolver } from "./resolvers/user";
import { EventResolver } from "./resolvers/event";

async function startServer() {
  try {
    config();

    const schema = await buildSchema({
      resolvers: [UserResolver, EventResolver],
      emitSchemaFile: true,
      dateScalarMode: "isoDate"
    });

    const MONGO_USER = process.env.MONGO_USER;
    const MONGO_PASS = process.env.MONGO_PASS;
    const PORT = process.env.PORT;
    const HOST = process.env.HOST;

    await Mongoose.connect(
      `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@sharepriceplus.crwbo.mongodb.net/SharePricePlus?retryWrites=true&w=majority`
    );

    console.log("Mongodb is connected successfully");
    const server = new ApolloServer({
      schema,
      context: ({ req }) => ({ req })
    });

    const app = Express();

    app.use(cors({ credentials: true, origin: "http://192.168.0.105:3000" }));

    const SESSION_SECRET = process.env.SESSION_SECRET || "localsecret";
    app.use(
      session({
        name: "spid",
        secret: SESSION_SECRET,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, secure: process.env.NODE_ENV === "production" }, // One day
        resave: false
      })
    );

    await server.start();
    server.applyMiddleware({ app });
    app.listen(PORT, () => {
      console.log(`Server: http://${HOST}:${PORT}, Playground: http://${HOST}:${PORT}/graphql`);
    });
  } catch (err) {
    console.log(err);
  }
}

startServer();
