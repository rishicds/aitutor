import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials from environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Cloudinary environment variables are not fully set.");
  // Depending on your error handling strategy, you might throw an error here
  // or allow the server to start and let requests fail.
  // For now, we log and proceed, but requests will fail if not configured.
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Ensures HTTPS URLs
});

export async function POST(req: Request) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Cloudinary server configuration incomplete.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { public_id } = body;

    if (!public_id) {
      return NextResponse.json({ error: 'Missing public_id' }, { status: 400 });
    }

    console.log(`Attempting to delete Cloudinary asset with public_id: ${public_id}`);

    // Delete the asset from Cloudinary
    // By default, it deletes 'image' resource type. For PDFs (raw files), specify 'raw' or 'auto'
    // If you upload PDFs as 'image' type (e.g. if Cloudinary converts them to image previews), then 'image' is fine.
    // Assuming PDFs are uploaded as 'raw' or Cloudinary handles type via public_id.
    // If you specified a folder during upload, that's part of the public_id.
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' }); // Use 'raw' for non-image files like PDFs. Use 'image' if you stored them as image type.

    console.log("Cloudinary deletion result:", result);

    if (result.result === 'ok' || result.result === 'not found') {
      // 'not found' means it's already deleted or never existed, which is acceptable for a delete operation.
      return NextResponse.json({ message: 'Asset deleted (or did not exist) successfully from Cloudinary.', details: result });
    } else {
      // This case might indicate an actual error from Cloudinary other than 'not found'
      return NextResponse.json({ error: 'Failed to delete asset from Cloudinary.', details: result }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in /api/delete-cloudinary:', error);
    // Type assertion for error or use a more general approach
    const errorMessage = error instanceof Error ? error.message : 'Server error during Cloudinary asset deletion.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 