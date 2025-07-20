
import { NextResponse, type NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { GridFSBucket, ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const { filename } = params;
  console.log(`[API /api/images/categories/[filename]] GET request for filename: ${filename}`);

  if (!filename) {
    return NextResponse.json({ message: 'Filename is required' }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const bucket = new GridFSBucket(db, {
      bucketName: 'category_images_uploads'
    });

    const files = await bucket.find({ filename }).toArray();

    if (!files || files.length === 0) {
      console.warn(`[API /api/images/categories/[filename]] File not found in GridFS: ${filename}`);
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    const fileDoc = files[0];
    
    // Important: Ensure fileDoc._id is a valid ObjectId if your GridFS stores it that way.
    // If find() already gives you the full document, you might not need to cast.
    const downloadStream = bucket.openDownloadStream(fileDoc._id as ObjectId);

    // Create a new ReadableStream from the GridFS download stream
    const readableStream = new ReadableStream({
      start(controller) {
        downloadStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        downloadStream.on('end', () => {
          controller.close();
        });
        downloadStream.on('error', (err) => {
          console.error(`[API /api/images/categories/[filename]] Stream error for ${filename}:`, err);
          controller.error(err);
        });
      },
    });
    
    const headers = new Headers();
    headers.set('Content-Type', fileDoc.contentType || 'application/octet-stream');
    headers.set('Content-Length', String(fileDoc.length));
    // Optional: Set Content-Disposition if you want to suggest a download filename
    // headers.set('Content-Disposition', `inline; filename="${fileDoc.filename}"`);

    console.log(`[API /api/images/categories/[filename]] Streaming file: ${filename} with contentType: ${fileDoc.contentType}`);
    return new NextResponse(readableStream, { status: 200, headers });

  } catch (error: any) {
    console.error(`[API /api/images/categories/[filename]] Error serving file ${filename}:`, error);
    return NextResponse.json({ message: 'Failed to serve image', error: error.message }, { status: 500 });
  }
}
