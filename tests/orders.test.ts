import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/app"; // your Express app

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Orders API", () => {
  it("should create a new order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        origin: { lat: 10, lng: 20 },
        destination: { lat: 30, lng: 40 },
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("_id");
  });
});
