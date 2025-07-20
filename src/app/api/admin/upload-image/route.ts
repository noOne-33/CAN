
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import crypto from 'crypto';
import path from 'path';
import { type Db, GridFSBucket } from 'mongodb';

// Disable Next.js body parsing for this route, as multer will handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

let gfs: GridFSBucket;
let storage: GridFsStorage;

async function initializeGridFS() {
  if (gfs && storage) {
    return { gfs, storage };
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI environment variable is not defined for GridFS.');
    throw new Error('Database configuration error: MONGODB_URI is not defined.');
  }

  const { db } = await connectToDatabase();
  
  gfs = new GridFSBucket(db, {
    bucketName: 'category_images_uploads' 
  });

  storage = new GridFsStorage({
    db: db as unknown as Db, // The type from multer-gridfs-storage expects Db from 'mongodb' v3/4
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const originalFilename = file.originalname || 'file';
          const filename = buf.toString('hex') + path.extname(originalFilename);
          const fileInfo = {
            filename: filename,
            bucketName: 'category_images_uploads' 
          };
          resolve(fileInfo);
        });
      });
    }
  });
  return { gfs, storage };
}


export async function POST(req: NextRequest) {
  console.log('[API /api/admin/upload-image] POST request received for GridFS upload');
  try {
    await initializeGridFS();
    const uploadMiddleware = multer({ storage }).single('file');

    // Need to convert NextRequest to something multer can understand (like a Node.js IncomingMessage)
    // This is a common challenge with Next.js API routes and multer.
    // A common pattern is to use a promise to handle the multer middleware.
    
    // Forcibly type 'req' as 'any' to bridge NextRequest and Express-like request for multer
    const reqAsAny = req as any; 
    // Multer expects req.headers, let's ensure it exists or provide an empty object
    if (!reqAsAny.headers) {
        reqAsAny.headers = {};
    }
    // Multer also might expect a 'pipe' method or other stream-like properties on 'req'
    // which NextRequest doesn't have directly in the same way.
    // We'll use a workaround to make multer process the formData.

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }
    
    // Manually simulate what multer's storage engine does for the filename and metadata
    const filename = await new Promise<string>((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) return reject(err);
            resolve(buf.toString('hex') + path.extname(file.originalname || '.png'));
        });
    });

    const { db } = await connectToDatabase();
    const bucket = new GridFSBucket(db, { bucketName: 'category_images_uploads' });
    
    const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.type || 'application/octet-stream'
    });

    // Convert file to buffer and write to stream
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    uploadStream.write(fileBuffer);
    uploadStream.end();

    return new Promise((resolvePromise, rejectPromise) => {
        uploadStream.on('finish', () => {
            console.log(`[API /api/admin/upload-image] File ${filename} uploaded to GridFS successfully.`);
            resolvePromise(NextResponse.json({ 
              message: 'File uploaded to GridFS successfully!', 
              filename: filename, // Return only the filename
              fileInfo: { // Mimic multer's req.file structure somewhat
                originalname: file.name,
                mimetype: file.type,
                size: file.size,
                filename: filename, // The generated filename stored in GridFS
              }
            }, { status: 200 }));
        });
        uploadStream.on('error', (err) => {
            console.error('[API /api/admin/upload-image] GridFS upload stream error:', err);
            rejectPromise(NextResponse.json({ message: 'GridFS upload failed', error: (err as Error).message }, { status: 500 }));
        });
    });

  } catch (error: any) {
    console.error('[API /api/admin/upload-image] POST Error:', error);
    return NextResponse.json({ message: 'Failed to process image upload.', error: error.message }, { status: 500 });
  }
}
