# Supabase Storage Setup Guide

## Overview
This guide explains how to set up Supabase Storage buckets for the El Bethel Academy Portal system.

## Storage Buckets to Create

### 1. **profiles** Bucket
- **Purpose**: Store user profile pictures
- **Public**: Yes (public read access)
- **Path Structure**: `/profiles/{user-id}/profile.jpg`

**Setup Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `profiles`
4. Set to Public: ✅ Yes
5. Click "Create"

**RLS Policy (Optional - for additional control):**
```sql
-- Allow users to upload their own profile pictures
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Allow public read access to profiles"
ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');
```

### 2. **documents** Bucket
- **Purpose**: Store student documents, certificates, etc.
- **Public**: No (private, authenticated access only)
- **Path Structure**: `/documents/{student-id}/{document-name}`

**Setup Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `documents`
4. Set to Public: ✅ No
5. Click "Create"

**RLS Policy:**
```sql
-- Students can upload to their folder
CREATE POLICY "Students can upload documents"
ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Students can read their documents
CREATE POLICY "Students can read their documents"
ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read all documents
CREATE POLICY "Admins can read all documents"
ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 3. **assignments** Bucket
- **Purpose**: Store assignment submissions and teacher materials
- **Public**: No (private, authenticated access only)
- **Path Structure**: `/assignments/{assignment-id}/{student-id}`

**Setup Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `assignments`
4. Set to Public: ✅ No
5. Click "Create"

**RLS Policy:**
```sql
-- Students can upload their submissions
CREATE POLICY "Students can upload assignments"
ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated'
);

-- Users can read assignments
CREATE POLICY "Users can read assignment materials"
ON storage.objects
FOR SELECT USING (
  bucket_id = 'assignments' AND
  auth.role() = 'authenticated'
);
```

### 4. **receipts** Bucket
- **Purpose**: Store payment receipts and fee documents
- **Public**: No (private, authenticated access only)
- **Path Structure**: `/receipts/{student-id}/{receipt-id}`

**Setup Steps:**
1. Go to Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Name: `receipts`
4. Set to Public: ✅ No
5. Click "Create"

**RLS Policy:**
```sql
-- Bursars can upload receipts
CREATE POLICY "Bursars can upload receipts"
ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'bursar')
  )
);

-- Students and parents can view their receipts
CREATE POLICY "Users can view their receipts"
ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'bursar')
    )
  )
);
```

## Implementation in Code

### Upload File Function
```typescript
import { supabase } from '@/lib/supabase-client'

async function uploadFile(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) throw error
  return data
}
```

### Get Public URL Function
```typescript
function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}
```

### Get Signed URL Function (for Private Files)
```typescript
async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}
```

## Testing

1. **Upload a test profile picture:**
   - Use the profiles bucket to verify public access works
   - Test download via public URL

2. **Upload a test document:**
   - Use the documents bucket as an authenticated user
   - Verify RLS policies prevent unauthorized access

3. **Test in Admin Panel:**
   - Create a test fee record with receipt
   - Verify upload/download functionality

## Troubleshooting

### Issue: "Access Denied" when uploading
- **Solution**: Verify RLS policies are correctly set up
- **Check**: Ensure user role is correct in `users` table

### Issue: "Not Found" when downloading
- **Solution**: Verify the exact path used in upload vs download
- **Check**: Bucket names are case-sensitive

### Issue: CORS errors in browser
- **Solution**: Add allowed origins in Supabase API settings
- **Step**: Dashboard → Project Settings → API → CORS

## File Upload Limits
- **Max file size**: 100 MB per file
- **Recommended**: Keep files under 50 MB for better performance

## Cleanup & Maintenance
- Implement automatic cleanup of old files
- Archive payment receipts after 12 months
- Delete temporary assignment submission backups after term ends

