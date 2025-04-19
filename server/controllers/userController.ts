
import { getUser } from "@server/services/userService";
import { Request, Response } from "express";

// userController.ts
export const getUserProfile = async (req: Request, res: Response) => {
    const userId = req.user?.id as number;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
  
    const user = await getUser(userId);
    res.json(user);
  };
  