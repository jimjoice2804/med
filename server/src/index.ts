import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blog";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    MY_SECRET: string;
  };
}>();

app.route("/api/v1/user", userRouter)
app.route('/api/v1/blog', blogRouter)

app.get("/", (c) => {
  return c.text("Hello Hono!");
});


export default app;

//postgres://avnadmin:AVNS_C03mGm8d54Wbkvol1sG@pg-1416e404-jimjoice28-d699.a.aivencloud.com:14631/defaultdb?sslmode=require
