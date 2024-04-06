import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    MY_SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const { email, password, name } = await c.req.json();

  //zod and hash password
  try {
    //checking if user already exist

    const userExist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (userExist) {
      return c.json({
        message: "User already exist",
      });
    }

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: password,
      },
    });

    const payload = {
      id: user.id,
    };

    const token = await sign(payload, c.env.MY_SECRET);

    return c.json({
      message: "user created successfully",
      data: user,
      token: token,
    });
  } catch (error) {
    console.log(error);
    return c.text("invalid");
  }
});


userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const { email, password } = await c.req.json();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        password: password,
      },
    });

    if (!user) {
      c.status(403);
      return c.json({
        message: "User doesn't exist",
      });
    }

    const payload = {
      id: user.id,
    };

    const token = await sign(payload, c.env.MY_SECRET);

    return c.json({
      message: "successfully signedIn",
      data: user,
      token: token,
    });
  } catch (error) {
    console.log(error);
    return c.text("invalid");
  }
});
