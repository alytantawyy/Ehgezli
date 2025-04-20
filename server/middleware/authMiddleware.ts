import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Define the JWT payload structure to match what's generated in authService.ts
interface JwtPayload {
  id: number;
  type: 'user' | 'restaurant';
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      
      // Set the user property based on the payload type
      (req as any).user = { 
        id: payload.id,
        type: payload.type
      };
      
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
}