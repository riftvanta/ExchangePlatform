import { Request, Response, NextFunction, RequestHandler } from 'express';
import { getUserById } from '../storage'; // Import getUserById

export const isAdmin = (async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.session.userId as string;
    const user = await getUserById(userId);

    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    next();
}) as RequestHandler;
