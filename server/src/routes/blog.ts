import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    MY_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const token = c.req.header("authorization") || "";
  const user = await verify(token, c.env.MY_SECRET);
  if (!user) {
    c.status(403);
    return c.json({
      message: "You are not loged in",
    });
  }
  c.set("userId", user.id);
  await next();
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const { title, content } = await c.req.json();
  const userId = c.get("userId");
  try {
    const blog = await prisma.post.create({
      data: {
        title: title,
        content: content,
        authorId: userId,
      },
    });

    return c.json({
      id: blog.id,
    });
  } catch (error) {}
});

blogRouter.put("/update/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const authorId = c.req.param("id");
  const { title, content } = await c.req.json();
  try {
    const blog = await prisma.post.update({
      where: {
        id: authorId,
      },
      data: {
        title: title,
        content: content,
      },
    });

    return c.json({
      id: blog.id,
      data: blog,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    return c.json({
      message: "Error while updating blog",
    });
  }
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  const id = c.req.param("id");
  try {
    const blog = await prisma.post.findFirst({
      where: {
        id: id,
      },
    });

    return c.json({
      blog: blog,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    c.json({
      message: "Error while fetchig blog post",
    });
  }
});

// add pagination
blogRouter.get("blogs/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const blogs = await prisma.post.findMany();

    return c.json({
      blogs: blogs,
    });
  } catch (error) {
    console.log(error);
    c.status(411);
    c.json({
      message: "Error while fetchig all blog post",
    });
  }
});
