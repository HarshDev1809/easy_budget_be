import { describe, it, expect, beforeEach, vi, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import db from "../db/index.js";
import { user, book, categories, transactions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import redis from "../redis/index.js";
import crypto from "crypto";
import { auth } from "../lib/auth.js";

vi.mock("../lib/auth.js", () => {
  return {
    auth: {
      api: {
        getSession: vi.fn(),
      },
    },
  };
});

describe("Transactions API", () => {
  let testUserId: string;
  let testBookId: string;
  let testCategoryId: number;

  beforeEach(async () => {
    await db.delete(transactions);
    await db.delete(categories);
    await db.delete(book);
    await db.delete(user);
    await redis.flushall();

    testUserId = crypto.randomUUID();
    await db.insert(user).values({
      id: testUserId,
      name: "Test User",
      email: `test-${testUserId}@example.com`,
    });

    const [newBook] = await db.insert(book).values({
      name: "Test Book",
      userId: testUserId,
      baseAmount: "100.00",
    }).returning();
    testBookId = newBook!.id;

    const [newCategory] = await db.insert(categories).values({
      bookId: testBookId,
      name: "Test Category",
      baseAmount: "50.00",
    }).returning();
    testCategoryId = newCategory!.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: testUserId },
      session: {},
    });
  });

  afterAll(async () => {
    await db.delete(transactions);
    await db.delete(categories);
    await db.delete(book);
    await db.delete(user);
    await redis.quit();
  });

  describe("POST /api/v1/transactions", () => {
    it("should create a credit transaction and update book/category balance", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .send({
          name: "Salary",
          amount: 200,
          type: "credit",
          bookId: testBookId,
          categoryId: testCategoryId,
        });

      expect(res.status).toBe(201);

      const b = await db.query.book.findFirst({ where: eq(book.id, testBookId) });
      expect(parseFloat(b!.baseAmount)).toBe(300);

      const c = await db.query.categories.findFirst({ where: eq(categories.id, testCategoryId) });
      expect(parseFloat(c!.baseAmount)).toBe(250);
    });

    it("should create a debit transaction without category", async () => {
      const res = await request(app)
        .post("/api/v1/transactions")
        .send({
          name: "Groceries",
          amount: 30,
          type: "debit",
          bookId: testBookId,
        });

      expect(res.status).toBe(201);

      const b = await db.query.book.findFirst({ where: eq(book.id, testBookId) });
      expect(parseFloat(b!.baseAmount)).toBe(70);
    });
  });

  describe("PUT /api/v1/transactions/:id", () => {
    it("should correctly update an existing transaction and reverse previous impacts", async () => {
      const [tx] = await db.insert(transactions).values({
        name: "Initial",
        amount: "50",
        type: "credit",
        bookId: testBookId,
        categoryId: testCategoryId,
      }).returning();

      await db.update(book).set({ baseAmount: "150" }).where(eq(book.id, testBookId));
      await db.update(categories).set({ baseAmount: "100" }).where(eq(categories.id, testCategoryId));

      const res = await request(app)
        .put(`/api/v1/transactions/${tx!.id}`)
        .send({
          name: "Updated",
          amount: 20,
          type: "debit",
          bookId: testBookId,
          categoryId: testCategoryId,
        });

      expect(res.status).toBe(200);

      const b = await db.query.book.findFirst({ where: eq(book.id, testBookId) });
      expect(parseFloat(b!.baseAmount)).toBe(80);

      const c = await db.query.categories.findFirst({ where: eq(categories.id, testCategoryId) });
      expect(parseFloat(c!.baseAmount)).toBe(30);
    });
  });

  describe("DELETE 2-Step Process", () => {
    it("should successfully generate token, validate it, and delete the transaction", async () => {
      const [tx] = await db.insert(transactions).values({
        name: "Delete Me",
        amount: "50",
        type: "debit",
        bookId: testBookId,
      }).returning();

      await db.update(book).set({ baseAmount: "50" }).where(eq(book.id, testBookId));

      const reqRes = await request(app)
        .post(`/api/v1/transactions/${tx!.id}/delete/request`)
        .send();
      expect(reqRes.status).toBe(200);
      const { token } = reqRes.body;
      expect(token).toHaveLength(6);

      const delRes = await request(app)
        .delete(`/api/v1/transactions/${tx!.id}`)
        .send({ token });

      expect(delRes.status).toBe(200);

      const b = await db.query.book.findFirst({ where: eq(book.id, testBookId) });
      expect(parseFloat(b!.baseAmount)).toBe(100);

      const checkTx = await db.query.transactions.findFirst({ where: eq(transactions.id, tx!.id) });
      expect(checkTx).toBeUndefined();

      const storedToken = await redis.get(`delete_tx_token:${tx!.id}`);
      expect(storedToken).toBeNull();
    });

    it("should fail deletion with wrong token", async () => {
      const [tx] = await db.insert(transactions).values({
        name: "Delete Me",
        amount: "50",
        type: "debit",
        bookId: testBookId,
      }).returning();

      await request(app).post(`/api/v1/transactions/${tx!.id}/delete/request`);

      const delRes = await request(app)
        .delete(`/api/v1/transactions/${tx!.id}`)
        .send({ token: "WRONG1" });

      expect(delRes.status).toBe(401);
    });
  });
});
