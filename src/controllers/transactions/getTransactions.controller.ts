import { and, eq, or, lt, gt, asc, desc, ilike, sql } from "drizzle-orm";
import db from "../../db/index.js";
import { transactions, categories } from "../../db/schema.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { Response, Request } from "express";

export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const {
    limit,
    cursor,
    sortBy,
    sortOrder,
    bookId,
    categoryId,
    transactionType,
    search,
  } = req.validated.query;

  const conditions = [eq(transactions.userId, userId)];

  // 1. Filter by bookId
  if (bookId) {
    conditions.push(eq(transactions.bookId, bookId));
  }

  // 2. Filter by categoryId
  if (categoryId !== undefined) {
    conditions.push(eq(transactions.categoryId, categoryId));
  }

  // 3. Filter by transactionType
  if (transactionType) {
    conditions.push(eq(transactions.type, transactionType));
  }

  // 4. Search logic (ilike on name, categoryName, or amount)
  if (search) {
    const searchPattern = `%${search}%`;
    const searchOr = or(
      ilike(transactions.name, searchPattern),
      ilike(categories.name, searchPattern),
      sql`CAST(${transactions.amount} AS TEXT) LIKE ${searchPattern}`
    );
    if (searchOr) {
      conditions.push(searchOr);
    }
  }

  // 5. Setup sorting columns mapping
  const sortColMap = {
    createdAt: transactions.createdAt,
    updatedAt: transactions.updatedAt,
    paidAt: transactions.paidAt,
    alphabet: transactions.name,
    price: transactions.amount,
  };

  const sortCol = sortColMap[sortBy as keyof typeof sortColMap] || transactions.createdAt;

  // 6. Handle cursor pagination boundary condition
  if (cursor) {
    try {
      const cursorData = JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
      const { sortByValue, id: cursorId } = cursorData;

      if (sortByValue !== undefined && cursorId !== undefined) {
        let boundaryVal: string | number | boolean | Date = sortByValue as string | number | boolean;
        if (["createdAt", "updatedAt", "paidAt"].includes(sortBy)) {
          boundaryVal = new Date(sortByValue as string | number | Date);
        }

        const isDesc = sortOrder === "desc";
        const mainOperator = isDesc ? lt : gt;
        const tieOperator = isDesc ? lt : gt;

        const cursorCond = or(
          mainOperator(sortCol, boundaryVal as string | Date),
          and(
            eq(sortCol, boundaryVal as string | Date),
            tieOperator(transactions.id, cursorId)
          )
        );
        if (cursorCond) {
          conditions.push(cursorCond);
        }
      }
    } catch (err) {
      console.error("Failed to parse pagination cursor:", err);
    }
  }

  // 7. Tie-breaker sorting
  const orderBy = [
    sortOrder === "desc" ? desc(sortCol) : asc(sortCol),
    sortOrder === "desc" ? desc(transactions.id) : asc(transactions.id),
  ];

  // 8. Fetch list with limit + 1
  const list = await db
    .select({
      id: transactions.id,
      name: transactions.name,
      amount: transactions.amount,
      type: transactions.type,
      bookId: transactions.bookId,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      paidAt: transactions.paidAt,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(limit + 1);

  // Determine if next page exists
  let nextCursor: string | null = null;
  const hasMore = list.length > limit;
  const paginatedList = hasMore ? list.slice(0, limit) : list;

  if (hasMore && paginatedList.length > 0) {
    const nextItem = paginatedList[paginatedList.length - 1];
    if (nextItem) {
      let sortByValue: unknown = nextItem[sortBy as keyof typeof nextItem];
      if (sortByValue instanceof Date) {
        sortByValue = sortByValue.toISOString();
      }
      const cursorObj = { sortByValue, id: nextItem.id };
      nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString("base64");
    }
  }

  // Formatting output schema for client container compatibility
  const formatted = paginatedList.map((item) => ({
    id: item.id,
    name: item.name,
    amount: item.amount,
    type: item.type,
    bookId: item.bookId,
    categoryId: item.categoryId ? String(item.categoryId) : null,
    categoryName: item.categoryName || null,
    paidAt: item.paidAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return res.status(200).json({
    success: true,
    data: formatted,
    nextCursor,
  });
});
