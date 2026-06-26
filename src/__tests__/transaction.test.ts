import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import db from "../db/index.js";
import { user, book, categories, transactions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import redis from "../redis/index.js";

interface TestTransaction {
  id: string;
  name: string;
  amount: string | number;
  type: string;
  categoryId?: string | null;
}

// Mock the auth module to simulate authenticated requests
vi.mock("../lib/auth.ts", () => {
  return {
    auth: {
      api: {
        getSession: async (options: { headers?: { cookie?: string } } | undefined) => {
          const cookie = options?.headers?.cookie || "";
          if (cookie.includes("session_token=test-session")) {
            return {
              user: {
                id: "test-user-id",
                email: "test@example.com",
                name: "Test User",
              },
              session: {
                id: "test-session-id",
                token: "test-session",
              },
            };
          }
          return null;
        },
      },
    },
  };
});

describe("Transactions Integration Tests", () => {
  const authCookie = "session_token=test-session";
  let testBookId: string;
  let testCategoryId: number;

  beforeAll(async () => {
    // 1. Clean up potential old test data to prevent duplicate key errors
    // Since user has related book/categories, delete them first.
    // However, Drizzle cascading deletes or fetching IDs manually can be tedious.
    // A simpler way is to fetch the user id, delete related tables if exists, then delete user.
    const [existingUser] = await db.select().from(user).where(eq(user.email, "test@example.com"));
    if (existingUser) {
      // Find books related to this user
      const existingBooks = await db.select().from(book).where(eq(book.userId, existingUser.id));
      for (const b of existingBooks) {
        // Find categories for this book
        await db.delete(categories).where(eq(categories.bookId, b.id));
        await db.delete(transactions).where(eq(transactions.bookId, b.id));
        await db.delete(book).where(eq(book.id, b.id));
      }
      await db.delete(user).where(eq(user.email, "test@example.com"));
    }

    // 2. Insert test user
    await db.insert(user).values({
      id: "test-user-id",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
    });

    // 3. Insert test book
    const [insertedBook] = await db
      .insert(book)
      .values({
        name: "Test Wallet",
        userId: "test-user-id",
        baseAmount: "1000.00",
        balance: "1000.00",
      })
      .returning();
    testBookId = insertedBook.id;

    // 4. Insert test category
    const [insertedCategory] = await db
      .insert(categories)
      .values({
        bookId: testBookId,
        name: "Groceries",
        baseAmount: "300.00",
        balance: "300.00",
        renewCycle: "monthly",
      })
      .returning();
    testCategoryId = insertedCategory.id;
  });

  afterAll(async () => {
    // Clean up all data associated with test user
    const [existingUser] = await db.select().from(user).where(eq(user.email, "test@example.com"));
    if (existingUser) {
      const existingBooks = await db.select().from(book).where(eq(book.userId, existingUser.id));
      for (const b of existingBooks) {
        await db.delete(categories).where(eq(categories.bookId, b.id));
        await db.delete(transactions).where(eq(transactions.bookId, b.id));
        await db.delete(book).where(eq(book.id, b.id));
      }
      await db.delete(user).where(eq(user.email, "test@example.com"));
    }
  });

  it("should fail authentication without session cookie", async () => {
    const res = await request(app)
      .post("/api/v1/transactions")
      .send({
        name: "Coffee",
        amount: 4.5,
        type: "debit",
        bookId: testBookId,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should create a debit transaction and subtract from balances", async () => {
    const res = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", authCookie)
      .send({
        name: "Lunch",
        amount: 25.5,
        type: "debit",
        bookId: testBookId,
        categoryId: testCategoryId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.name).toBe("Lunch");
    expect(res.body.data.transaction.amount).toBe("25.50");
    expect(res.body.data.transaction.type).toBe("debit");
    expect(res.body.data.transaction.categoryId).toBe(String(testCategoryId));

    // Verify Book and Category balances updated in DB
    const [updatedBook] = await db.select().from(book).where(eq(book.id, testBookId));
    expect(Number(updatedBook.balance)).toBe(974.5); // 1000.00 - 25.50

    const [updatedCategory] = await db.select().from(categories).where(eq(categories.id, testCategoryId));
    expect(Number(updatedCategory.balance)).toBe(274.5); // 300.00 - 25.50
  });

  it("should create a debit transaction with a custom client-provided createdAt date", async () => {
    const customDate = "2025-12-25T12:00:00.000Z";
    const res = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", authCookie)
      .send({
        name: "Backdated Grocery",
        amount: 15.0,
        type: "debit",
        bookId: testBookId,
        createdAt: customDate,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(new Date(res.body.data.transaction.createdAt).toISOString()).toBe(customDate);
  });

  it("should create a credit transaction and add to balances", async () => {
    const res = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", authCookie)
      .send({
        name: "Gift Money",
        amount: 100.0,
        type: "credit",
        bookId: testBookId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.categoryId).toBeNull();

    // Verify Book balance updated (Category remains untouched since categoryId was null)
    const [updatedBook] = await db.select().from(book).where(eq(book.id, testBookId));
    expect(Number(updatedBook.balance)).toBe(1059.5); // 959.50 + 100.00
  });

  it("should reject transaction creation if book does not belong to user", async () => {
    const res = await request(app)
      .post("/api/v1/transactions")
      .set("Cookie", authCookie)
      .send({
        name: "Steal Cash",
        amount: 50.0,
        type: "debit",
        bookId: "00000000-0000-0000-0000-000000000000",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should update a transaction and recalculate balances (PUT)", async () => {
    // 1. First, fetch transaction list to get an ID
    const listRes = await request(app)
      .get("/api/v1/transactions")
      .set("Cookie", authCookie);

    const transactionToUpdate = listRes.body.data.find((t: TestTransaction) => t.name === "Lunch");
    expect(transactionToUpdate).toBeDefined();

    // 2. Update it from: Lunch, 25.50, debit, Groceries (testCategoryId)
    // To: Gourmet Lunch, 30.00, debit, Groceries (testCategoryId)
    const updateRes = await request(app)
      .put(`/api/v1/transactions/${transactionToUpdate.id}`)
      .set("Cookie", authCookie)
      .send({
        name: "Gourmet Lunch",
        amount: 30.0,
        type: "debit",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.transaction.name).toBe("Gourmet Lunch");
    expect(updateRes.body.data.transaction.amount).toBe("30.00");

    // 3. Verify balance calculations:
    // Old Book balance: 1059.50
    // Reversing 25.50 debit: 1059.50 + 25.50 = 1085.00
    // Applying 30.00 debit: 1085.00 - 30.00 = 1055.00
    const [updatedBook] = await db.select().from(book).where(eq(book.id, testBookId));
    expect(Number(updatedBook.balance)).toBe(1055.0);

    // Old Category balance: 274.50
    // Reversing 25.50 debit: 274.50 + 25.50 = 300.00
    // Applying 30.00 debit: 300.00 - 30.00 = 270.00
    const [updatedCategory] = await db.select().from(categories).where(eq(categories.id, testCategoryId));
    expect(Number(updatedCategory.balance)).toBe(270.0);
  });

  it("should trigger deletion request (Phase 1) and return 6-character token", async () => {
    const listRes = await request(app)
      .get("/api/v1/transactions")
      .set("Cookie", authCookie);

    const transactionToDelete = listRes.body.data.find((t: TestTransaction) => t.name === "Gourmet Lunch");
    expect(transactionToDelete).toBeDefined();

    const requestRes = await request(app)
      .post(`/api/v1/transactions/${transactionToDelete.id}/delete-request`)
      .set("Cookie", authCookie);

    expect(requestRes.status).toBe(200);
    expect(requestRes.body.success).toBe(true);
    expect(requestRes.body.data.token).toHaveLength(6);

    // Check Redis directly to verify the token is set with correct TTL
    const storedToken = await redis.get(`delete-transaction:${transactionToDelete.id}`);
    expect(storedToken).toBe(requestRes.body.data.token);

    const ttl = await redis.ttl(`delete-transaction:${transactionToDelete.id}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(300);
  });

  it("should fail deletion (Phase 2) with missing or wrong token", async () => {
    const listRes = await request(app)
      .get("/api/v1/transactions")
      .set("Cookie", authCookie);

    const transactionToDelete = listRes.body.data.find((t: TestTransaction) => t.name === "Gourmet Lunch");

    // Mismatched token
    const resWrong = await request(app)
      .delete(`/api/v1/transactions/${transactionToDelete.id}`)
      .set("Cookie", authCookie)
      .send({ token: "WRONG1" });

    expect(resWrong.status).toBe(400);
    expect(resWrong.body.success).toBe(false);

    // Missing token in body
    const resMissing = await request(app)
      .delete(`/api/v1/transactions/${transactionToDelete.id}`)
      .set("Cookie", authCookie)
      .send({});

    expect(resMissing.status).toBe(400);
  });

  it("should support limit pagination and return nextCursor", async () => {
    // We have 3 transactions in DB at this point: Gourmet Lunch (30.00), Backdated Grocery (15.00), Gift Money (100.00)
    const resLimit = await request(app)
      .get("/api/v1/transactions?limit=2")
      .set("Cookie", authCookie);

    expect(resLimit.status).toBe(200);
    expect(resLimit.body.success).toBe(true);
    expect(resLimit.body.data).toHaveLength(2);
    expect(resLimit.body.nextCursor).toBeTypeOf("string");

    // Fetch the next page using the cursor
    const resNext = await request(app)
      .get(`/api/v1/transactions?limit=2&cursor=${resLimit.body.nextCursor}`)
      .set("Cookie", authCookie);

    expect(resNext.status).toBe(200);
    expect(resNext.body.success).toBe(true);
    expect(resNext.body.data).toHaveLength(1);
    expect(resNext.body.nextCursor).toBeNull();
  });

  it("should filter transactions by transactionType", async () => {
    const resType = await request(app)
      .get("/api/v1/transactions?transactionType=credit")
      .set("Cookie", authCookie);

    expect(resType.status).toBe(200);
    expect(resType.body.data).toHaveLength(1);
    expect(resType.body.data[0].name).toBe("Gift Money");
  });

  it("should search transactions by name, category name, or amount", async () => {
    // Search by category name "Groceries"
    const resCatSearch = await request(app)
      .get("/api/v1/transactions?search=Groceries")
      .set("Cookie", authCookie);

    expect(resCatSearch.status).toBe(200);
    // Should find Gourmet Lunch because it has category "Groceries"
    expect(resCatSearch.body.data.some((t: TestTransaction) => t.name === "Gourmet Lunch")).toBe(true);

    // Search by name "Backdated"
    const resNameSearch = await request(app)
      .get("/api/v1/transactions?search=Backdated")
      .set("Cookie", authCookie);

    expect(resNameSearch.status).toBe(200);
    expect(resNameSearch.body.data).toHaveLength(1);
    expect(resNameSearch.body.data[0].name).toBe("Backdated Grocery");
  });

  it("should sort transactions by price (amount)", async () => {
    const resPriceAsc = await request(app)
      .get("/api/v1/transactions?sortBy=price&sortOrder=asc")
      .set("Cookie", authCookie);

    expect(resPriceAsc.status).toBe(200);
    const amounts = resPriceAsc.body.data.map((t: TestTransaction) => Number(t.amount));
    expect(amounts).toEqual([15.0, 30.0, 100.0]); // Backdated Grocery, Gourmet Lunch, Gift Money
  });

  it("should delete transaction and roll back balances with correct token (Phase 2)", async () => {
    const listRes = await request(app)
      .get("/api/v1/transactions")
      .set("Cookie", authCookie);

    const transactionToDelete = listRes.body.data.find((t: TestTransaction) => t.name === "Gourmet Lunch");
    const storedToken = await redis.get(`delete-transaction:${transactionToDelete.id}`);

    // Confirm deletion
    const deleteRes = await request(app)
      .delete(`/api/v1/transactions/${transactionToDelete.id}`)
      .set("Cookie", authCookie)
      .send({ token: storedToken });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    // 1. Verify balances are rolled back (Gourmet Lunch was 30.00 debit, so it should add 30.00 back)
    // Book balance before delete: 1055.00 -> should be 1055.00 + 30.00 = 1085.00
    const [updatedBook] = await db.select().from(book).where(eq(book.id, testBookId));
    expect(Number(updatedBook.balance)).toBe(1085.0);

    // Category balance before delete: 270.00 -> should be 270.00 + 30.00 = 300.00
    const [updatedCategory] = await db.select().from(categories).where(eq(categories.id, testCategoryId));
    expect(Number(updatedCategory.balance)).toBe(300.0);

    // 2. Verify transaction is deleted from DB
    const [checkTxn] = await db.select().from(transactions).where(eq(transactions.id, transactionToDelete.id));
    expect(checkTxn).toBeUndefined();

    // 3. Verify Redis key is purged
    const checkRedis = await redis.get(`delete-transaction:${transactionToDelete.id}`);
    expect(checkRedis).toBeNull();
  });
});
