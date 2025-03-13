import { Router, Request, Response } from 'express';
import { generatePresignedUrl } from '../s3'; // Import the function
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/api/upload-url', (async (req: Request, res: Response) => {
    try {
        const { contentType } = req.body;

        if (!contentType) {
            return res.status(400).json({ error: 'Content type is required' });
        }

        const key = `${uuidv4()}`; // Generate a unique key
        const uploadURL = await generatePresignedUrl(key, contentType);

        res.status(200).json({ uploadURL, key });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate presigned URL' });
    }
}) as any);

export default router;
